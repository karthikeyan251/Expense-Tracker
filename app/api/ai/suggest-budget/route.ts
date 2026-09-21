import { NextRequest, NextResponse } from "next/server";
import { suggestBudgetAllocations } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { income, salary, rent = 0, otherFixedExpenses = 0, currency = "INR" } = body;

    const numSalary = parseFloat(salary || income || 0);
    const numRent = parseFloat(rent || 0);
    const numFixed = parseFloat(otherFixedExpenses || 0);

    if (isNaN(numSalary) || numSalary <= 0) {
      return NextResponse.json({ error: "Please enter a valid monthly salary greater than 0" }, { status: 400 });
    }

    const availableMoney = Math.max(0, numSalary - numRent - numFixed);

    const allocations = await suggestBudgetAllocations(availableMoney, currency, numSalary, numRent);

    return NextResponse.json({
      success: true,
      salary: numSalary,
      rent: numRent,
      otherFixedExpenses: numFixed,
      availableMoney,
      currency,
      allocations,
    });
  } catch (error: any) {
    console.error("Suggest budget error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate AI budget suggestions" }, { status: 500 });
  }
}
