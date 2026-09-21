import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthYear, getDaysRemainingInMonth } from "@/lib/utils";
import { reallocateBudgetAI } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = "user-1" } = body;

    const currentMonth = getCurrentMonthYear();
    const daysRemaining = getDaysRemainingInMonth();

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const salary = user.monthlyIncome || 0;
    const rent = user.monthlyRent || 0;
    const fixed = user.otherFixedExpenses || 0;
    const availableMoney = Math.max(0, salary - rent - fixed);

    // Fetch category budgets
    const budgets = await prisma.categoryBudget.findMany({
      where: { userId: user.id, monthYear: currentMonth },
    });

    // Exclude rent from discretionary budgets sum if rent is tracked
    const nonRentBudgets = budgets.filter((b) => b.categoryName.toLowerCase() !== "rent");
    const totalAllocatedNonRent = nonRentBudgets.reduce((acc, b) => acc + b.allocatedAmount, 0);
    const totalSpentNonRent = nonRentBudgets.reduce((acc, b) => acc + b.currentSpent, 0);

    const poolAllocated = totalAllocatedNonRent > 0 ? totalAllocatedNonRent : availableMoney;
    const remainingMonthlyBudget = Math.max(0, poolAllocated - totalSpentNonRent);

    // Fetch today's expenses
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayExpenses = await prisma.expense.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        budget: true,
      },
    });

    const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Calculate original daily limit for today
    const spentBeforeToday = totalSpentNonRent - todaySpent;
    const budgetStartOfDay = Math.max(0, poolAllocated - spentBeforeToday);
    const originalDailyLimit = parseFloat((budgetStartOfDay / daysRemaining).toFixed(2));
    const overspentAmount = Math.max(0, parseFloat((todaySpent - originalDailyLimit).toFixed(2)));

    // Category breakdown for today
    const categoryBreakdownMap: Record<string, number> = {};
    todayExpenses.forEach((exp) => {
      const cat = exp.budget?.categoryName || "General";
      categoryBreakdownMap[cat] = (categoryBreakdownMap[cat] || 0) + exp.amount;
    });

    const categoryBreakdownToday = Object.entries(categoryBreakdownMap).map(([categoryName, amount]) => ({
      categoryName,
      amount,
    }));

    // AI Reallocation trigger
    const aiResult = await reallocateBudgetAI({
      salary,
      rent,
      availableMoney,
      remainingMonthlyBudget,
      daysRemaining,
      todaySpent,
      originalDailyLimit,
      overspentAmount,
      currency: user.currency || "INR",
      categoryBudgets: budgets.map((b) => ({
        categoryName: b.categoryName,
        allocated: b.allocatedAmount,
        spent: b.currentSpent,
        isEssential: b.isEssential,
      })),
    });

    const revisedDailyLimit = Math.max(0, parseFloat((remainingMonthlyBudget / daysRemaining).toFixed(2)));

    return NextResponse.json({
      success: true,
      todaySpent,
      originalDailyLimit,
      overspentAmount,
      isOverspent: todaySpent > originalDailyLimit,
      remainingMonthlyBudget,
      revisedDailyLimit: aiResult.revisedDailyLimit || revisedDailyLimit,
      daysRemaining,
      explanation: aiResult.explanation,
      categoryAdjustments: aiResult.categoryAdjustments,
      categoryBreakdownToday,
      user: {
        currency: user.currency || "INR",
        salary,
        rent,
        availableMoney,
      },
    });
  } catch (error: any) {
    console.error("AI Reallocation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate AI reallocation" }, { status: 500 });
  }
}
