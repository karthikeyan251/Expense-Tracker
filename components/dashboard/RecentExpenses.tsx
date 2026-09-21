"use client";

import React from "react";
import { Banknote, Smartphone, CreditCard, Landmark, Sparkles, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ExpenseItem {
  id: string;
  merchant: string;
  amount: number;
  paymentMethod: string;
  source: string;
  notes?: string | null;
  expenseDate: string;
}

interface RecentExpensesProps {
  expenses: ExpenseItem[];
  currency: string;
}

export const RecentExpenses: React.FC<RecentExpensesProps> = ({ expenses, currency }) => {
  const getMethodIcon = (method: string) => {
    switch (method) {
      case "GPAY_UPI":
        return <Smartphone className="h-4 w-4 text-emerald-400" />;
      case "CARD":
        return <CreditCard className="h-4 w-4 text-indigo-400" />;
      case "NET_BANKING":
        return <Landmark className="h-4 w-4 text-amber-400" />;
      default:
        return <Banknote className="h-4 w-4 text-slate-300" />;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "AI_CHAT":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
            <Sparkles className="h-3 w-3" /> AI Voice/Chat
          </span>
        );
      case "PDF_PARSE":
      case "CSV_PARSE":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
            <FileText className="h-3 w-3" /> Bank Statement
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
            Manual Cash
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Recent Transactions</h2>
          <p className="text-xs text-slate-400">Cash, UPI & Digital Statement Ingestions</p>
        </div>
        <span className="text-xs text-slate-500 font-medium">Last {expenses.length} items</span>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs">
          No expenses logged yet. Use the micro-entry modal or AI Chat to log one!
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {expenses.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center">
                  {getMethodIcon(exp.paymentMethod)}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{exp.merchant}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getSourceBadge(exp.source)}
                    <span className="text-[10px] text-slate-500">
                      {new Date(exp.expenseDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-white">
                  -{formatCurrency(exp.amount, currency)}
                </p>
                <p className="text-[10px] text-slate-400">
                  {exp.paymentMethod.replace("_", " ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
