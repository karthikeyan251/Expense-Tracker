import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = "INR"): string {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return "0.00";

  const symbolMap: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };

  const symbol = symbolMap[currency] || "₹";

  return `${symbol}${numericAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function getDaysRemainingInMonth(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysLeft = totalDays - currentDay + 1; // including today
  return daysLeft > 0 ? daysLeft : 1;
}

export function getCurrentMonthYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export interface CategorySummary {
  categoryName: string;
  isEssential: boolean;
  allocatedAmount: number;
  currentSpent: number;
}

export function calculateDailySafeSpend(budgets: CategorySummary[]): number {
  const daysRemaining = getDaysRemainingInMonth();
  
  // Sum of remaining non-essential (Wants, isEssential = false) budgets
  const nonEssentialRemainingSum = budgets
    .filter((b) => !b.isEssential)
    .reduce((sum, b) => {
      const remaining = Math.max(0, b.allocatedAmount - b.currentSpent);
      return sum + remaining;
    }, 0);

  return parseFloat((nonEssentialRemainingSum / daysRemaining).toFixed(2));
}
