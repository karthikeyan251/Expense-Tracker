"use client";

import React from "react";
import { AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OverspendingAlertCardProps {
  overspentAmount: number;
  todaySpent: number;
  todayDailyLimit: number;
  currency?: string;
  onTriggerReallocation: () => void;
}

export const OverspendingAlertCard: React.FC<OverspendingAlertCardProps> = ({
  overspentAmount,
  todaySpent,
  todayDailyLimit,
  currency = "INR",
  onTriggerReallocation,
}) => {
  if (overspentAmount <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/80 border-2 border-red-500/40 p-4 sm:p-5 rounded-3xl shadow-xl space-y-3 text-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-red-400 flex items-center gap-2">
              Daily Limit Exceeded!
            </h3>
            <p className="text-sm font-semibold text-slate-200">
              You spent <span className="text-red-400 font-extrabold">{formatCurrency(overspentAmount, currency)}</span> more than today's limit ({formatCurrency(todayDailyLimit, currency)}).
            </p>
            <p className="text-xs text-slate-400">
              Today's Spending: {formatCurrency(todaySpent, currency)} • AI Reallocation can recalculate your remaining daily limits.
            </p>
          </div>
        </div>

        <button
          onClick={onTriggerReallocation}
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-xs shrink-0"
        >
          <Sparkles className="h-4 w-4" />
          <span>Reallocate Budget with AI</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
