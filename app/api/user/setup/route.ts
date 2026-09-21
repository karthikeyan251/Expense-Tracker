import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthYear } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = "user-1",
      monthlyIncome,
      monthlyRent = 0,
      otherFixedExpenses = 0,
      savingsGoal = 0,
      currency = "INR",
      salaryCreditDay = 1,
      customAllocations,
    } = body;

    const salary = parseFloat(monthlyIncome);
    const rent = parseFloat(monthlyRent) || 0;
    const fixedExpenses = parseFloat(otherFixedExpenses) || 0;
    const savings = parseFloat(savingsGoal) || 0;

    if (isNaN(salary) || salary <= 0) {
      return NextResponse.json({ error: "Please enter a valid monthly salary" }, { status: 400 });
    }

    if (rent < 0) {
      return NextResponse.json({ error: "Rent cannot be negative" }, { status: 400 });
    }

    const availableMoney = salary - rent - fixedExpenses;
    if (availableMoney < 0) {
      return NextResponse.json(
        { error: "Monthly rent and fixed expenses cannot exceed your monthly salary" },
        { status: 400 }
      );
    }

    // Upsert user details
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        monthlyIncome: salary,
        monthlyRent: rent,
        otherFixedExpenses: fixedExpenses,
        savingsGoal: savings,
        currency,
        salaryCreditDay: Number(salaryCreditDay) || 1,
      },
      create: {
        id: userId,
        name: userId === "demo-user-1" || userId === "user-1" ? "Primary User" : `User ${userId}`,
        email: `${userId}@smartfinance.ai`,
        monthlyIncome: salary,
        monthlyRent: rent,
        otherFixedExpenses: fixedExpenses,
        savingsGoal: savings,
        currency,
        salaryCreditDay: Number(salaryCreditDay) || 1,
      },
    });

    const currentMonth = getCurrentMonthYear();

    // Default category allocations based on Available Money if customAllocations not provided
    const allocationsToUse = Array.isArray(customAllocations) && customAllocations.length > 0
      ? customAllocations
      : [
          { name: "Food", pct: 25, isEssential: true, type: "Needs" },
          { name: "Transportation", pct: 15, isEssential: true, type: "Needs" },
          { name: "Shopping", pct: 15, isEssential: false, type: "Wants" },
          { name: "Bills", pct: 15, isEssential: true, type: "Needs" },
          { name: "Entertainment", pct: 10, isEssential: false, type: "Wants" },
          { name: "Savings", pct: 10, isEssential: true, type: "Savings" },
          { name: "Other Needs", pct: 10, isEssential: true, type: "Needs" },
        ];

    const createdBudgets = [];

    // Ensure Rent is also stored as a dedicated Essential category budget if rent > 0
    if (rent > 0) {
      const rentBudget = await prisma.categoryBudget.upsert({
        where: {
          userId_categoryName_monthYear: {
            userId: user.id,
            categoryName: "Rent",
            monthYear: currentMonth,
          },
        },
        update: {
          allocatedAmount: rent,
          isEssential: true,
        },
        create: {
          userId: user.id,
          categoryName: "Rent",
          isEssential: true,
          allocatedAmount: rent,
          currentSpent: rent, // Mark as paid fixed commitment
          monthYear: currentMonth,
        },
      });
      createdBudgets.push(rentBudget);
    }

    // Process categories allocated from Available Money
    for (const alloc of allocationsToUse) {
      const categoryName = alloc.name || alloc.categoryName;
      if (categoryName.toLowerCase() === "rent") continue; // Skip rent as handled above

      let allocatedAmount = 0;
      if (alloc.amount !== undefined && !isNaN(parseFloat(alloc.amount))) {
        allocatedAmount = parseFloat(alloc.amount);
      } else {
        const pct = Number(alloc.pct) || 0;
        allocatedAmount = parseFloat(((availableMoney * pct) / 100).toFixed(2));
      }

      const budget = await prisma.categoryBudget.upsert({
        where: {
          userId_categoryName_monthYear: {
            userId: user.id,
            categoryName,
            monthYear: currentMonth,
          },
        },
        update: {
          allocatedAmount,
          isEssential: Boolean(alloc.isEssential),
        },
        create: {
          userId: user.id,
          categoryName,
          isEssential: Boolean(alloc.isEssential),
          allocatedAmount,
          currentSpent: 0,
          monthYear: currentMonth,
        },
      });
      createdBudgets.push(budget);
    }

    return NextResponse.json({
      success: true,
      user,
      availableMoney,
      budgets: createdBudgets,
    });
  } catch (error: any) {
    console.error("User setup error:", error);
    return NextResponse.json({ error: error.message || "Failed to save financial setup" }, { status: 500 });
  }
}
