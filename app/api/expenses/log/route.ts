import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthYear } from "@/lib/utils";
import { rebalanceEngine } from "@/lib/rebalanceEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = "demo-user-1",
      amount,
      categoryName,
      merchant,
      paymentMethod = "CASH",
      source = "MANUAL_CASH",
      notes,
      expenseDate,
    } = body;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Invalid expense amount" }, { status: 400 });
    }

    if (!categoryName || !merchant) {
      return NextResponse.json({ error: "Category name and merchant are required" }, { status: 400 });
    }

    const monthYear = getCurrentMonthYear();

    // Ensure User exists
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          name: "Alex Morgan",
          email: "user@smartfinance.ai",
          monthlyIncome: 100000,
          currency: "INR",
        },
      });
    }

    // Find category budget for current month
    let budget = await prisma.categoryBudget.findFirst({
      where: {
        userId: user.id,
        categoryName: { equals: categoryName },
        monthYear,
      },
    });

    // Fallback if budget doesn't exist yet
    if (!budget) {
      budget = await prisma.categoryBudget.create({
        data: {
          userId: user.id,
          categoryName,
          isEssential: false,
          allocatedAmount: 10000,
          currentSpent: 0,
          monthYear,
        },
      });
    }

    // Create Expense record
    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
        budgetId: budget.id,
        amount: numericAmount,
        merchant,
        paymentMethod,
        source,
        notes: notes || null,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      },
    });

    // Update currentSpent on category budget
    const newSpent = budget.currentSpent + numericAmount;
    const updatedBudget = await prisma.categoryBudget.update({
      where: { id: budget.id },
      data: { currentSpent: newSpent },
    });

    // Dynamic Overspending & Reallocation Logic Engine (Module C)
    let rebalanceResult = null;
    if (newSpent > updatedBudget.allocatedAmount) {
      const excess = newSpent - updatedBudget.allocatedAmount;
      rebalanceResult = await rebalanceEngine(user.id, updatedBudget.categoryName, excess, user.currency);
    }

    // Proactive Deal Trigger (Module E)
    // If (allocatedAmount - currentSpent) / allocatedAmount < 0.20
    const remaining = updatedBudget.allocatedAmount - updatedBudget.currentSpent;
    const remainingRatio = updatedBudget.allocatedAmount > 0 ? remaining / updatedBudget.allocatedAmount : 1;

    let dealMatchesFound: any[] = [];
    if (remainingRatio < 0.20 && remainingRatio >= 0) {
      const matchingDeals = await prisma.deal.findMany({
        where: {
          category: {
            equals: categoryName,
          },
        },
        take: 3,
      });

      for (const deal of matchingDeals) {
        const dealMatch = await prisma.dealMatch.create({
          data: {
            userId: user.id,
            dealId: deal.id,
            triggerReason: `${categoryName} budget remaining is under 20% (${(remainingRatio * 100).toFixed(0)}% left)`,
          },
          include: { deal: true },
        });
        dealMatchesFound.push(dealMatch);
      }
    }

    return NextResponse.json({
      success: true,
      expense,
      budgetStatus: {
        categoryName: updatedBudget.categoryName,
        allocatedAmount: updatedBudget.allocatedAmount,
        currentSpent: updatedBudget.currentSpent,
        isOverbudget: updatedBudget.currentSpent > updatedBudget.allocatedAmount,
      },
      rebalanceResult,
      triggeredDeals: dealMatchesFound,
    });
  } catch (error: any) {
    console.error("Log expense error:", error);
    return NextResponse.json({ error: error.message || "Failed to log expense" }, { status: 500 });
  }
}
