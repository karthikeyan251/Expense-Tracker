"use client";

import React from "react";
import { Sparkles, PieChart, TrendingUp, ShieldAlert, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DailySpendingSummaryCardProps {
  todaySpent: number;
  originalDailyLimit: number;
  overspentAmount: number;
  isOverspent: boolean;
  remainingToday: number;
  remainingMonthlyBudget: number;
  revisedDailyLimit: number;
  categoryBreakdownToday: Array<{ categoryName: string; amount: number }>;
  currency?: string;
}

export const DailySpendingSummaryCard: React.FC<DailySpendingSummaryCardProps> = ({
  todaySpent,
  originalDailyLimit,
  overspentAmount,
  isOverspent,
  remainingToday,
  remainingMonthlyBudget,
  revisedDailyLimit,
  categoryBreakdownToday = [],
  currency = "INR",
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 text-white">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Daily AI Spending Summary</h3>
            <p className="text-xs text-slate-400">Real-time daily transaction audit & insights</p>
          </div>
        </div>

        <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 font-medium">
          Today's Overview
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Spent Today</span>
          <span className="text-lg font-black text-white">{formatCurrency(todaySpent, currency)}</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Original Daily Limit</span>
          <span className="text-lg font-black text-slate-200">{formatCurrency(originalDailyLimit, currency)}</span>
        </div>

        <div className={`p-3.5 rounded-2xl border ${
          isOverspent ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"
        }`}>
          <span className={`text-[10px] font-bold uppercase block ${isOverspent ? "text-red-400" : "text-emerald-400"}`}>
            {isOverspent ? "Overspent" : "Remaining Today"}
          </span>
          <span className={`text-lg font-black ${isOverspent ? "text-red-400" : "text-emerald-400"}`}>
            {isOverspent ? formatCurrency(overspentAmount, currency) : formatCurrency(remainingToday, currency)}
          </span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Revised Daily Limit</span>
          <span className="text-lg font-black text-emerald-400">{formatCurrency(revisedDailyLimit, currency)}</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <PieChart className="h-4 w-4 text-indigo-400" />
          <span>Category Breakdown (Today)</span>
        </h4>

        {categoryBreakdownToday.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categoryBreakdownToday.map((item) => (
              <div
                key={item.categoryName}
                className="bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-300">{item.categoryName}</span>
                <span className="font-bold text-white">{formatCurrency(item.amount, currency)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic p-3 bg-slate-950/50 rounded-xl text-center border border-slate-800/50">
            No expenses logged yet today.
          </p>
        )}
      </div>

      {/* AI Recommendation Note */}
      <div className="bg-gradient-to-r from-emerald-950/30 to-indigo-950/30 p-3.5 rounded-2xl border border-emerald-500/20 text-xs space-y-1">
        <p className="font-bold text-emerald-400 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> AI Recommendation:
        </p>
        <p className="text-slate-300 leading-relaxed">
          {isOverspent
            ? `Your remaining budget has been recalculated based on today's spending. Revised Daily Limit: ${formatCurrency(revisedDailyLimit, currency)}. Try to reduce unnecessary spending tomorrow.`
            : `Great job! You stayed within your daily spending limit today. Your remaining monthly balance is ${formatCurrency(remainingMonthlyBudget, currency)}.`}
        </p>
      </div>
    </div>
  );
};
