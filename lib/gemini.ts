import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface ParsedExpenseAI {
  amount: number;
  merchant: string;
  category: string;
  paymentMethod: "CASH" | "GPAY_UPI" | "CARD" | "NET_BANKING";
  notes?: string;
}

export interface BudgetAllocationItem {
  name: string;
  pct: number;
  amount: number;
  isEssential: boolean;
  type: "Needs" | "Wants" | "Savings";
  explanation?: string;
}

export interface ReallocationResponseAI {
  revisedDailyLimit: number;
  explanation: string;
  categoryAdjustments: Array<{
    categoryName: string;
    oldAllocated: number;
    newAllocated: number;
    change: number;
    reason: string;
  }>;
}

/**
 * Natural Language Expense Logging using Gemini 2.5 Flash
 */
export async function parseNaturalLanguageExpense(
  userPrompt: string
): Promise<ParsedExpenseAI | null> {
  if (!ai || !apiKey) {
    return fallbackParseExpense(userPrompt);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a financial AI assistant. Extract transaction details from this user input: "${userPrompt}".
Return strictly a raw JSON object with NO markdown formatting, no backticks, matching this JSON schema:
{
  "amount": number,
  "merchant": string,
  "category": string (Choose closest from: 'Food', 'Transportation', 'Shopping', 'Bills', 'Entertainment', 'Savings', 'Other Needs'),
  "paymentMethod": string (Choose from: 'CASH', 'GPAY_UPI', 'CARD', 'NET_BANKING'),
  "notes": string
}`,
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      amount: Number(parsed.amount) || 0,
      merchant: parsed.merchant || "Expense",
      category: parsed.category || "Shopping",
      paymentMethod: ["CASH", "GPAY_UPI", "CARD", "NET_BANKING"].includes(parsed.paymentMethod)
        ? parsed.paymentMethod
        : "CASH",
      notes: parsed.notes || userPrompt,
    };
  } catch (error) {
    console.error("Gemini NLP expense parsing error:", error);
    return fallbackParseExpense(userPrompt);
  }
}

function fallbackParseExpense(prompt: string): ParsedExpenseAI {
  const amountMatch = prompt.match(/(?:₹|\$|€|INR|rs\.?|rs)?\s*(\d+(?:\.\d+)?)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 100;

  let paymentMethod: ParsedExpenseAI["paymentMethod"] = "CASH";
  if (/upi|gpay|paytm|phonepe/i.test(prompt)) paymentMethod = "GPAY_UPI";
  else if (/card|credit|debit/i.test(prompt)) paymentMethod = "CARD";
  else if (/net\s*banking|transfer/i.test(prompt)) paymentMethod = "NET_BANKING";

  let category = "Shopping";
  if (/grocer|blinkit|zepto|supermarket|food|fruit|dine|restaurant|swiggy|zomato/i.test(prompt)) category = "Food";
  else if (/petrol|fuel|gas|diesel|hp|shell|bus|auto|cab|uber|ola/i.test(prompt)) category = "Transportation";
  else if (/rent|flat|house/i.test(prompt)) category = "Rent";
  else if (/bill|utility|electric|water|wifi|recharge/i.test(prompt)) category = "Bills";
  else if (/movie|netfl|game|entertainment/i.test(prompt)) category = "Entertainment";
  else if (/save|invest|fd|sip/i.test(prompt)) category = "Savings";

  const merchantMatch = prompt.match(/(?:for|at|on|paid|to)\s+([A-Za-z0-9\s]+)/i);
  const merchant = merchantMatch ? merchantMatch[1].trim().split(" ")[0] : category;

  return {
    amount,
    merchant,
    category,
    paymentMethod,
    notes: prompt,
  };
}

/**
 * Dynamic AI Budget Allocation recommendation for Available Money
 */
export async function suggestBudgetAllocations(
  availableMoney: number,
  currency: string = "INR",
  salary: number = 30000,
  rent: number = 8000
): Promise<BudgetAllocationItem[]> {
  if (!ai || !apiKey) {
    return fallbackBudgetAllocation(availableMoney);
  }

  try {
    const prompt = `You are an expert personal finance AI assistant.
User Profile:
- Monthly Salary: ${currency} ${salary}
- Monthly Rent: ${currency} ${rent}
- Available Money for Allocation: ${currency} ${availableMoney}

Suggest an optimal budget allocation for the remaining ${currency} ${availableMoney} across these exact categories:
1. Food
2. Transportation
3. Shopping
4. Bills
5. Entertainment
6. Savings
7. Other Needs

Return strictly a raw JSON array of objects with NO markdown, matching this JSON schema:
[
  { "name": "Food", "pct": number, "isEssential": true, "type": "Needs", "explanation": "string" },
  { "name": "Transportation", "pct": number, "isEssential": true, "type": "Needs", "explanation": "string" },
  { "name": "Shopping", "pct": number, "isEssential": false, "type": "Wants", "explanation": "string" },
  { "name": "Bills", "pct": number, "isEssential": true, "type": "Needs", "explanation": "string" },
  { "name": "Entertainment", "pct": number, "isEssential": false, "type": "Wants", "explanation": "string" },
  { "name": "Savings", "pct": number, "isEssential": true, "type": "Savings", "explanation": "string" },
  { "name": "Other Needs", "pct": number, "isEssential": true, "type": "Needs", "explanation": "string" }
]
Constraint: The sum of 'pct' values MUST equal exactly 100.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const items = JSON.parse(cleanJson);

    if (Array.isArray(items) && items.length > 0) {
      let validItems = items.map((item) => {
        const pct = Math.max(0, Number(item.pct) || 0);
        const amount = parseFloat(((availableMoney * pct) / 100).toFixed(2));
        return {
          name: String(item.name),
          pct,
          amount,
          isEssential: Boolean(item.isEssential),
          type: (["Needs", "Wants", "Savings"].includes(item.type) ? item.type : "Needs") as "Needs" | "Wants" | "Savings",
          explanation: item.explanation || `Suggested ${pct}% for ${item.name}`,
        };
      });

      // Normalize percentages to 100%
      const totalPct = validItems.reduce((acc, curr) => acc + curr.pct, 0);
      if (totalPct > 0 && Math.abs(totalPct - 100) > 0.5) {
        validItems = validItems.map((it) => {
          const normPct = Math.round((it.pct / totalPct) * 100);
          return {
            ...it,
            pct: normPct,
            amount: parseFloat(((availableMoney * normPct) / 100).toFixed(2)),
          };
        });
      }
      return validItems;
    }
  } catch (err) {
    console.error("Gemini budget recommendation error:", err);
  }

  return fallbackBudgetAllocation(availableMoney);
}

function fallbackBudgetAllocation(availableMoney: number): BudgetAllocationItem[] {
  const defaults = [
    { name: "Food", pct: 30, isEssential: true, type: "Needs" as const, explanation: "Essential daily nutrition and groceries" },
    { name: "Transportation", pct: 15, isEssential: true, type: "Needs" as const, explanation: "Commute and transit expenses" },
    { name: "Shopping", pct: 10, isEssential: false, type: "Wants" as const, explanation: "Apparel and discretionary purchases" },
    { name: "Bills", pct: 15, isEssential: true, type: "Needs" as const, explanation: "Electricity, internet, and utilities" },
    { name: "Entertainment", pct: 5, isEssential: false, type: "Wants" as const, explanation: "Movies, dining out, and leisure" },
    { name: "Savings", pct: 15, isEssential: true, type: "Savings" as const, explanation: "Emergency fund and future goals" },
    { name: "Other Needs", pct: 10, isEssential: true, type: "Needs" as const, explanation: "Miscellaneous essential expenditures" },
  ];

  return defaults.map((d) => ({
    ...d,
    amount: parseFloat(((availableMoney * d.pct) / 100).toFixed(2)),
  }));
}

/**
 * AI Budget Reallocation when daily limit is exceeded
 */
export async function reallocateBudgetAI(data: {
  salary: number;
  rent: number;
  availableMoney: number;
  remainingMonthlyBudget: number;
  daysRemaining: number;
  todaySpent: number;
  originalDailyLimit: number;
  overspentAmount: number;
  currency: string;
  categoryBudgets: Array<{ categoryName: string; allocated: number; spent: number; isEssential: boolean }>;
}): Promise<ReallocationResponseAI> {
  const revisedDailyLimit = Math.max(0, parseFloat((data.remainingMonthlyBudget / Math.max(1, data.daysRemaining)).toFixed(2)));

  if (!ai || !apiKey) {
    return {
      revisedDailyLimit,
      explanation: `Your remaining budget has been recalculated based on today's spending. Try to reduce discretionary expenses tomorrow to stay on track.`,
      categoryAdjustments: [],
    };
  }

  try {
    const prompt = `You are a Smart Financial AI Reallocator.
Current Situation:
- Monthly Salary: ${data.currency} ${data.salary}
- Rent (Fixed & Protected): ${data.currency} ${data.rent}
- Monthly Available Money: ${data.currency} ${data.availableMoney}
- Remaining Monthly Budget: ${data.currency} ${data.remainingMonthlyBudget}
- Days Remaining in Month: ${data.daysRemaining}
- Original Daily Spending Limit: ${data.currency} ${data.originalDailyLimit}
- Today's Spending: ${data.currency} ${data.todaySpent}
- Overspent Amount Today: ${data.currency} ${data.overspentAmount}
- Current Category Breakdown: ${JSON.stringify(data.categoryBudgets)}

Instructions:
1. Re-calculate the revised daily limit strictly from remaining budget / remaining days.
2. Provide a supportive, realistic AI recommendation explaining what changed and how to stay within budget.
3. NEVER touch or reduce paid rent or essential fixed commitments.
4. Do NOT delete transactions or invent money that does not exist.

Return strictly a valid JSON object matching this schema:
{
  "revisedDailyLimit": number,
  "explanation": "string",
  "categoryAdjustments": []
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      revisedDailyLimit: Number(parsed.revisedDailyLimit) || revisedDailyLimit,
      explanation: parsed.explanation || `Your remaining budget has been recalculated based on today's spending. Your revised daily limit is ${data.currency} ${revisedDailyLimit}.`,
      categoryAdjustments: Array.isArray(parsed.categoryAdjustments) ? parsed.categoryAdjustments : [],
    };
  } catch (err) {
    console.error("AI Budget Reallocation error:", err);
    return {
      revisedDailyLimit,
      explanation: `Your remaining budget has been recalculated based on today's spending. Your revised daily spending limit is ${data.currency} ${revisedDailyLimit}.`,
      categoryAdjustments: [],
    };
  }
}

/**
 * Generate AI Financial Advice answering user query
 */
export async function generateFinancialAdvice(
  userQuery: string,
  contextData: {
    monthlyIncome: number;
    currency: string;
    dailySafeSpend: number;
    budgets: Array<{ categoryName: string; allocated: number; spent: number; remaining: number }>;
  }
): Promise<string> {
  if (!ai || !apiKey) {
    return generateFallbackAdvice(userQuery, contextData);
  }

  try {
    const prompt = `You are a Smart Personal Finance Assistant.
User Context:
- Monthly Income: ${contextData.currency} ${contextData.monthlyIncome}
- Daily Safe Spend Limit: ${contextData.currency} ${contextData.dailySafeSpend}
- Current Budgets Breakdown: ${JSON.stringify(contextData.budgets)}

User Query: "${userQuery}"

CRITICAL INSTRUCTIONS:
1. Answer strictly and directly to what the user asked in their query.
2. Keep response clear, precise, and concise (under 100 words).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text?.trim() || generateFallbackAdvice(userQuery, contextData);
  } catch (err) {
    console.error("Gemini financial advice error:", err);
    return generateFallbackAdvice(userQuery, contextData);
  }
}

function generateFallbackAdvice(
  userQuery: string,
  contextData: {
    monthlyIncome: number;
    currency: string;
    dailySafeSpend: number;
    budgets: Array<{ categoryName: string; allocated: number; spent: number; remaining: number }>;
  }
): string {
  const currencySymbol = contextData.currency === "INR" ? "₹" : contextData.currency === "USD" ? "$" : "€";
  const amountMatch = userQuery.match(/(?:₹|\$|€|INR|rs\.?|rs)?\s*(\d+(?:\.\d+)?)/i);
  const requestedAmount = amountMatch ? parseFloat(amountMatch[1]) : 0;

  if (requestedAmount > 0) {
    const remainingWants = contextData.budgets
      .filter((b) => !["rent", "groceries", "savings"].some((k) => b.categoryName.toLowerCase().includes(k)))
      .reduce((acc, curr) => acc + curr.remaining, 0);

    if (requestedAmount <= contextData.dailySafeSpend) {
      return `Yes, you can afford ${currencySymbol}${requestedAmount.toLocaleString()} today. It is within your Daily Safe Spend limit of ${currencySymbol}${contextData.dailySafeSpend.toLocaleString()}/day.`;
    } else if (requestedAmount <= remainingWants) {
      return `You can afford ${currencySymbol}${requestedAmount.toLocaleString()}, but note it exceeds your single-day safe spend of ${currencySymbol}${contextData.dailySafeSpend.toLocaleString()}/day. It will come out of your remaining discretionary budget (${currencySymbol}${remainingWants.toLocaleString()}).`;
    } else {
      return `Spending ${currencySymbol}${requestedAmount.toLocaleString()} exceeds your remaining discretionary budget (${currencySymbol}${remainingWants.toLocaleString()}). Auto-rebalance will reallocate funds from other non-essential categories to protect your savings.`;
    }
  }

  return `Your current Daily Safe Spend limit is ${currencySymbol}${contextData.dailySafeSpend.toLocaleString()}/day out of your ${currencySymbol}${contextData.monthlyIncome.toLocaleString()} monthly income.`;
}
