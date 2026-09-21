import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthYear, calculateDailySafeSpend } from "@/lib/utils";
import { parseNaturalLanguageExpense, generateFinancialAdvice } from "@/lib/gemini";
import { rebalanceEngine } from "@/lib/rebalanceEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, userId = "demo-user-1" } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const currentMonth = getCurrentMonthYear();

    // 1. Fetch User and Budgets
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        budgets: {
          where: { monthYear: currentMonth },
        },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          name: "Alex Morgan",
          email: "user@smartfinance.ai",
          monthlyIncome: 100000,
          currency: "INR",
        },
        include: {
          budgets: {
            where: { monthYear: currentMonth },
          },
        },
      });
    }

    const currencySymbol = user.currency === "INR" ? "₹" : user.currency === "USD" ? "$" : "€";

    // Detect if this is an expense logging action vs advice question
    const isExpenseIntent =
      /spent|paid|bought|cost|expense|spent|purhased|credit|debit|\d+/i.test(prompt) &&
      !/can i|should i|afford|advice|how much|safe to spend|what is/i.test(prompt);

    let aiMessage = "";
    let expenseCreated: any = null;
    let rebalanceAlert: any = null;
    let dealCards: any[] = [];

    if (isExpenseIntent) {
      // Natural Language Logging via Gemini 2.5 Flash
      const parsed = await parseNaturalLanguageExpense(prompt);
      if (parsed && parsed.amount > 0) {
        // Find matching budget category
        let budget = user.budgets.find(
          (b) => b.categoryName.toLowerCase() === parsed.category.toLowerCase()
        );

        if (!budget) {
          budget = await prisma.categoryBudget.create({
            data: {
              userId: user.id,
              categoryName: parsed.category,
              isEssential: false,
              allocatedAmount: 10000,
              currentSpent: 0,
              monthYear: currentMonth,
            },
          });
        }

        // Create Expense in DB
        expenseCreated = await prisma.expense.create({
          data: {
            userId: user.id,
            budgetId: budget.id,
            amount: parsed.amount,
            merchant: parsed.merchant,
            paymentMethod: parsed.paymentMethod,
            source: "AI_CHAT",
            notes: parsed.notes || prompt,
          },
        });

        // Update category spent
        const updatedSpent = budget.currentSpent + parsed.amount;
        const updatedBudget = await prisma.categoryBudget.update({
          where: { id: budget.id },
          data: { currentSpent: updatedSpent },
        });

        aiMessage = `Logged ${currencySymbol}${parsed.amount.toLocaleString()} for ${parsed.merchant} under ${updatedBudget.categoryName} (${parsed.paymentMethod.replace("_", " ")}).`;

        // Check if overbudget -> trigger dynamic rebalancing
        if (updatedSpent > updatedBudget.allocatedAmount) {
          const excess = updatedSpent - updatedBudget.allocatedAmount;
          rebalanceAlert = await rebalanceEngine(user.id, updatedBudget.categoryName, excess, user.currency);
          if (rebalanceAlert.messages && rebalanceAlert.messages.length > 0) {
            aiMessage += `\n\n🔄 ${rebalanceAlert.messages.join("\n🔄 ")}`;
          }
        }

        // Proactive Deal Trigger Check (< 20% remaining)
        const remaining = updatedBudget.allocatedAmount - updatedSpent;
        const remainingPct = updatedBudget.allocatedAmount > 0 ? remaining / updatedBudget.allocatedAmount : 1;

        if (remainingPct < 0.20) {
          const deals = await prisma.deal.findMany({
            where: {
              category: {
                equals: updatedBudget.categoryName,
              },
            },
            take: 2,
          });

          dealCards = deals;
          if (deals.length > 0) {
            aiMessage += `\n\n💡 Proactive Deal Alert: Your ${updatedBudget.categoryName} budget has only ${(remainingPct * 100).toFixed(0)}% remaining! Check out these instant coupon offers below to save on your next order:`;
          }
        }
      }
    }

    if (!aiMessage) {
      // General Financial Advice Query
      const categorySummaries = user.budgets.map((b) => ({
        categoryName: b.categoryName,
        isEssential: b.isEssential,
        allocatedAmount: b.allocatedAmount,
        currentSpent: b.currentSpent,
      }));

      const dailySafeSpend = calculateDailySafeSpend(categorySummaries);

      const adviceContext = {
        monthlyIncome: user.monthlyIncome,
        currency: user.currency,
        dailySafeSpend,
        budgets: user.budgets.map((b) => ({
          categoryName: b.categoryName,
          allocated: b.allocatedAmount,
          spent: b.currentSpent,
          remaining: Math.max(0, b.allocatedAmount - b.currentSpent),
        })),
      };

      aiMessage = await generateFinancialAdvice(prompt, adviceContext);

      // Check if any category is below 20% remaining to attach relevant deal cards
      const lowBudgetCategories = user.budgets.filter((b) => {
        const rem = b.allocatedAmount - b.currentSpent;
        return b.allocatedAmount > 0 && rem / b.allocatedAmount < 0.20;
      });

      if (lowBudgetCategories.length > 0) {
        const matchingDeals = await prisma.deal.findMany({
          where: {
            category: {
              in: lowBudgetCategories.map((c) => c.categoryName),
            },
          },
          take: 3,
        });
        dealCards = matchingDeals;
      }
    }

    return NextResponse.json({
      success: true,
      reply: aiMessage,
      expenseCreated,
      rebalanceAlert,
      dealCards,
    });
  } catch (error: any) {
    console.error("AI Chat route error:", error);
    return NextResponse.json({ error: error.message || "AI Chat failed" }, { status: 500 });
  }
}
