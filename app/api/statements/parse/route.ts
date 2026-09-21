import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthYear } from "@/lib/utils";
import { parseBankStatementBuffer } from "@/lib/statementParser";
import { rebalanceEngine } from "@/lib/rebalanceEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const password = (formData.get("password") as string) || "";
    const userId = (formData.get("userId") as string) || "demo-user-1";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileType = file.type || file.name.split(".").pop() || "pdf";

    // 1. Log Bank Statement ingestion
    const bankStatement = await prisma.bankStatement.create({
      data: {
        userId,
        fileName: file.name,
        fileType,
        status: "PROCESSING",
      },
    });

    // 2. Extract transaction line items using pdf-parse / papaparse + Gemini 2.5 Flash
    let extractedItems = [];
    try {
      extractedItems = await parseBankStatementBuffer(buffer, fileType, password);
    } catch (parseError: any) {
      await prisma.bankStatement.update({
        where: { id: bankStatement.id },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ error: parseError.message || "Failed to parse bank statement" }, { status: 400 });
    }

    const currentMonth = getCurrentMonthYear();

    // Ensure User
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const currency = user?.currency || "INR";

    const insertedExpenses = [];
    const rebalanceEvents = [];
    const overspentCategories = new Set<string>();

    for (const item of extractedItems) {
      // Find or create CategoryBudget
      let budget = await prisma.categoryBudget.findFirst({
        where: {
          userId,
          categoryName: { equals: item.suggestedCategory },
          monthYear: currentMonth,
        },
      });

      if (!budget) {
        budget = await prisma.categoryBudget.create({
          data: {
            userId,
            categoryName: item.suggestedCategory,
            isEssential: false,
            allocatedAmount: 10000,
            currentSpent: 0,
            monthYear: currentMonth,
          },
        });
      }

      // Record Expense
      const exp = await prisma.expense.create({
        data: {
          userId,
          budgetId: budget.id,
          amount: item.amount,
          merchant: item.merchant,
          paymentMethod: item.paymentMethod,
          source: fileType.includes("csv") ? "CSV_PARSE" : "PDF_PARSE",
          notes: item.notes || `Statement ${file.name}`,
          expenseDate: item.date ? new Date(item.date) : new Date(),
        },
      });

      insertedExpenses.push(exp);

      // Update budget currentSpent
      const updatedBudget = await prisma.categoryBudget.update({
        where: { id: budget.id },
        data: {
          currentSpent: {
            increment: item.amount,
          },
        },
      });

      if (updatedBudget.currentSpent > updatedBudget.allocatedAmount) {
        overspentCategories.add(updatedBudget.categoryName);
      }
    }

    // Trigger rebalancing for overspent categories
    for (const catName of Array.from(overspentCategories)) {
      const budget = await prisma.categoryBudget.findFirst({
        where: { userId, categoryName: catName, monthYear: currentMonth },
      });
      if (budget && budget.currentSpent > budget.allocatedAmount) {
        const excess = budget.currentSpent - budget.allocatedAmount;
        const reb = await rebalanceEngine(userId, catName, excess, currency);
        if (reb.triggered) {
          rebalanceEvents.push(...reb.rebalancedEvents);
        }
      }
    }

    // Update bank statement status
    await prisma.bankStatement.update({
      where: { id: bankStatement.id },
      data: {
        status: "COMPLETED",
        extractedItemCount: extractedItems.length,
        parsedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      statementId: bankStatement.id,
      extractedCount: extractedItems.length,
      expenses: insertedExpenses,
      rebalanceEvents,
    });
  } catch (error: any) {
    console.error("Statement upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to process bank statement" }, { status: 500 });
  }
}
