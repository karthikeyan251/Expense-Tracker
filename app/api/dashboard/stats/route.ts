import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthYear, getDaysRemainingInMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user-1";
    const currentMonth = getCurrentMonthYear();

    // Fetch user details
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          name: userId === "demo-user-1" || userId === "user-1" ? "Primary User" : `User ${userId}`,
          email: `${userId}@smartfinance.ai`,
          monthlyIncome: 0,
          monthlyRent: 0,
          otherFixedExpenses: 0,
          savingsGoal: 0,
          currency: "INR",
        },
      });
    }

    // Fetch category budgets for current month
    let budgets = await prisma.categoryBudget.findMany({
      where: {
        userId: user.id,
        monthYear: currentMonth,
      },
    });

    const needsSetup = !user.monthlyIncome || user.monthlyIncome <= 0 || budgets.length === 0;

    const daysRemaining = getDaysRemainingInMonth();

    // Calculate Available Money = Monthly Salary - Monthly Rent - Other Fixed Expenses
    const salary = user.monthlyIncome || 0;
    const rent = user.monthlyRent || 0;
    const fixedExpenses = user.otherFixedExpenses || 0;
    const availableMoney = Math.max(0, salary - rent - fixedExpenses);

    // Calculate non-rent spending & budgets
    const nonRentBudgets = budgets.filter((b) => b.categoryName.toLowerCase() !== "rent");
    const totalNonRentAllocated = nonRentBudgets.reduce((acc, curr) => acc + curr.allocatedAmount, 0);
    const totalNonRentSpent = nonRentBudgets.reduce((acc, curr) => acc + curr.currentSpent, 0);

    const effectiveAllocatedPool = totalNonRentAllocated > 0 ? totalNonRentAllocated : availableMoney;
    const remainingMonthlyBudget = Math.max(0, effectiveAllocatedPool - totalNonRentSpent);

    // Today's spending analysis
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

    // Today's Limit formula:
    // Remaining Budget = Available Money - Total Spent
    // Daily Limit = Remaining Budget / Remaining Days
    const spentBeforeToday = totalNonRentSpent - todaySpent;
    const budgetStartOfDay = Math.max(0, effectiveAllocatedPool - spentBeforeToday);
    const todayDailyLimit = parseFloat((budgetStartOfDay / daysRemaining).toFixed(2));
    const remainingToday = Math.max(0, parseFloat((todayDailyLimit - todaySpent).toFixed(2)));

    const isOverspentToday = todaySpent > todayDailyLimit;
    const overspentAmount = isOverspentToday ? parseFloat((todaySpent - todayDailyLimit).toFixed(2)) : 0;

    // Today's category-wise spending breakdown
    const categoryBreakdownMap: Record<string, number> = {};
    todayExpenses.forEach((exp) => {
      const cat = exp.budget?.categoryName || "Other";
      categoryBreakdownMap[cat] = (categoryBreakdownMap[cat] || 0) + exp.amount;
    });

    const categoryBreakdownToday = Object.entries(categoryBreakdownMap).map(([categoryName, amount]) => ({
      categoryName,
      amount,
    }));

    // Aggregated Chart Data
    const pieChartData = budgets.map((b) => ({
      name: b.categoryName,
      value: b.allocatedAmount,
      isEssential: b.isEssential,
      type: b.categoryName.toLowerCase().includes("savings") || b.categoryName.toLowerCase().includes("invest")
        ? "Savings"
        : b.isEssential
        ? "Needs"
        : "Wants",
    }));

    const barChartData = budgets.map((b) => ({
      category: b.categoryName,
      Allocated: b.allocatedAmount,
      Spent: b.currentSpent,
      isOverbudget: b.currentSpent > b.allocatedAmount,
      isEssential: b.isEssential,
    }));

    const recentExpenses = await prisma.expense.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const rebalanceAudit = await prisma.rebalanceEvent.findMany({
      where: { userId: user.id },
      include: {
        fromCategory: { select: { categoryName: true } },
        toCategory: { select: { categoryName: true } },
      },
      orderBy: { timestamp: "desc" },
      take: 5,
    });

    const activeDeals = await prisma.deal.findMany({ take: 6 });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        monthlyIncome: user.monthlyIncome,
        monthlyRent: user.monthlyRent,
        otherFixedExpenses: user.otherFixedExpenses,
        savingsGoal: user.savingsGoal,
        currency: user.currency,
      },
      needsSetup,
      daysRemaining,
      dailySafeSpend: todayDailyLimit,
      todayDailyLimit,
      todaySpent,
      remainingToday,
      isOverspentToday,
      overspentAmount,
      availableMoney,
      remainingMonthlyBudget,
      categoryBreakdownToday,
      totals: {
        monthlyIncome: user.monthlyIncome,
        monthlyRent: user.monthlyRent,
        otherFixedExpenses: user.otherFixedExpenses,
        availableMoney,
        totalAllocated: effectiveAllocatedPool,
        totalSpent: totalNonRentSpent,
        totalRemaining: remainingMonthlyBudget,
      },
      budgets,
      charts: {
        pieChartData,
        barChartData,
      },
      recentExpenses,
      rebalanceAudit,
      activeDeals,
    });
  } catch (error: any) {
    console.error("Fetch dashboard stats error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
