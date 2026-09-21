import { prisma } from "./prisma";
import { getCurrentMonthYear, formatCurrency } from "./utils";

export interface RebalanceResult {
  triggered: boolean;
  rebalancedEvents: Array<{
    id: string;
    fromCategoryName: string;
    toCategoryName: string;
    amount: number;
    reason: string;
  }>;
  messages: string[];
}

/**
 * Dynamic Overspending & Reallocation Logic Engine
 * @param userId - ID of the user
 * @param overspentCategoryName - Name of the category that went over budget
 * @param excessAmount - Amount spent beyond the allocated budget
 * @param userCurrency - Currency symbol / code (default 'INR')
 */
export async function rebalanceEngine(
  userId: string,
  overspentCategoryName: string,
  excessAmount: number,
  userCurrency = "INR"
): Promise<RebalanceResult> {
  const currentMonthYear = getCurrentMonthYear();

  if (excessAmount <= 0) {
    return { triggered: false, rebalancedEvents: [], messages: [] };
  }

  // Fetch all budgets for this user for the current month
  const userBudgets = await prisma.categoryBudget.findMany({
    where: {
      userId,
      monthYear: currentMonthYear,
    },
    select: {
      id: true,
      categoryName: true,
      isEssential: true,
      allocatedAmount: true,
      currentSpent: true,
    },
  });

  const overspentBudget = userBudgets.find(
    (b) => b.categoryName.toLowerCase() === overspentCategoryName.toLowerCase()
  );

  if (!overspentBudget) {
    return { triggered: false, rebalancedEvents: [], messages: [] };
  }

  // Rule 1 (Protection): Never deduct from categories marked isEssential = true
  // Reallocation Search (Rule 2): Available non-essential categories (isEssential = false) with remaining funds
  const availableNonEssentialBudgets = userBudgets
    .filter((b) => !b.isEssential && b.id !== overspentBudget.id)
    .map((b) => ({
      ...b,
      remaining: Math.max(0, b.allocatedAmount - b.currentSpent),
    }))
    .filter((b) => b.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining); // sort highest remaining first

  if (availableNonEssentialBudgets.length === 0) {
    return {
      triggered: true,
      rebalancedEvents: [],
      messages: [
        `Overspent ${formatCurrency(excessAmount, userCurrency)} on ${overspentBudget.categoryName}, but no non-essential budget had available funds left for dynamic reallocation.`,
      ],
    };
  }

  let amountToCover = excessAmount;
  const rebalancedEvents: RebalanceResult["rebalancedEvents"] = [];
  const messages: string[] = [];

  for (const sourceCategory of availableNonEssentialBudgets) {
    if (amountToCover <= 0) break;

    const deductAmount = Math.min(amountToCover, sourceCategory.remaining);
    if (deductAmount <= 0) continue;

    // Rule 3 (Execution): Subtract deductAmount from source budget and add to target overspent budget
    const updatedSource = await prisma.categoryBudget.update({
      where: { id: sourceCategory.id },
      data: {
        allocatedAmount: {
          decrement: deductAmount,
        },
      },
    });

    const updatedTarget = await prisma.categoryBudget.update({
      where: { id: overspentBudget.id },
      data: {
        allocatedAmount: {
          increment: deductAmount,
        },
      },
    });

    const reason = `Auto-reallocated ${formatCurrency(
      deductAmount,
      userCurrency
    )} from ${sourceCategory.categoryName} to cover overspending on ${overspentBudget.categoryName} and protect Savings.`;

    // Rule 4 (Audit Logging): Create RebalanceEvent entry
    const rebalanceEvent = await prisma.rebalanceEvent.create({
      data: {
        userId,
        fromBudgetId: sourceCategory.id,
        toBudgetId: overspentBudget.id,
        amountReallocated: deductAmount,
        reason,
      },
    });

    rebalancedEvents.push({
      id: rebalanceEvent.id,
      fromCategoryName: sourceCategory.categoryName,
      toCategoryName: overspentBudget.categoryName,
      amount: deductAmount,
      reason,
    });

    const msg = `Overspent ${formatCurrency(
      excessAmount,
      userCurrency
    )} on ${overspentBudget.categoryName}. Transferred ${formatCurrency(
      deductAmount,
      userCurrency
    )} budget from ${sourceCategory.categoryName} to protect your Savings.`;

    messages.push(msg);

    amountToCover -= deductAmount;
  }

  return {
    triggered: true,
    rebalancedEvents,
    messages,
  };
}
