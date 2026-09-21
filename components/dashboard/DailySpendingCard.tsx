"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Calendar, Flame, Wallet, ArrowDownRight, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DailySpendingCardProps {
  todayDailyLimit: number;
  todaySpent: number;
  remainingToday: number;
  daysRemaining: number;
  availableMoney: number;
  remainingMonthlyBudget: number;
  currency?: string;
  isOverspent: boolean;
  overspentAmount: number;
}

export const DailySpendingCard: React.FC<DailySpendingCardProps> = ({
  todayDailyLimit,
  todaySpent,
  remainingToday,
  daysRemaining,
  availableMoney,
  remainingMonthlyBudget,
  currency = "INR",
  isOverspent,
  overspentAmount,
}) => {
  const percentSpent = todayDailyLimit > 0 ? Math.min(100, (todaySpent / todayDailyLimit) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 shadow-xl shadow-black/40 text-white"
    >
      {/* Background Ambient Glows */}
      <div className={`absolute -right-10 -top-10 h-48 w-48 rounded-full blur-3xl pointer-events-none ${isOverspent ? "bg-red-500/15" : "bg-emerald-500/15"}`} />
      <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="space-y-6 relative z-10">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isOverspent
                ? "bg-red-500/10 text-red-400 border-red-500/30"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            }`}>
              <ShieldCheck className="h-3.5 w-3.5" />
              Daily Spending Limit
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              {daysRemaining} Days Left in Month
            </span>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Monthly Available: <strong className="text-white">{formatCurrency(availableMoney, currency)}</strong>
          </div>
        </div>

        {/* 3 Main Metric Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Today's Limit */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Today's Spending Limit
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {formatCurrency(todayDailyLimit, currency)}
            </div>
            <p className="text-[10px] text-slate-500">Calculated for today</p>
          </div>

          {/* 2. Today's Spent */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Today's Spent
            </span>
            <div className={`text-2xl sm:text-3xl font-black ${isOverspent ? "text-red-400" : "text-amber-400"}`}>
              {formatCurrency(todaySpent, currency)}
            </div>
            <p className="text-[10px] text-slate-500">Decrements remaining limit</p>
          </div>

          {/* 3. Remaining Today */}
          <div className={`p-4 rounded-2xl border space-y-1 ${
            isOverspent
              ? "bg-red-500/10 border-red-500/30"
              : "bg-emerald-500/10 border-emerald-500/30"
          }`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${
              isOverspent ? "text-red-400" : "text-emerald-400"
            }`}>
              {isOverspent ? "Overspent Today" : "Remaining Today"}
            </span>
            <div className={`text-2xl sm:text-3xl font-black ${
              isOverspent ? "text-red-400" : "text-emerald-400"
            }`}>
              {isOverspent ? formatCurrency(overspentAmount, currency) : formatCurrency(remainingToday, currency)}
            </div>
            <p className="text-[10px] opacity-80">
              {isOverspent ? "⚠️ Over limit by " + formatCurrency(overspentAmount, currency) : "✅ Safe to spend today"}
            </p>
          </div>
        </div>

        {/* Progress Bar & Subtitle */}
        <div className="space-y-2 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/60">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">Daily Budget Consumption</span>
            <span className={isOverspent ? "text-red-400" : "text-emerald-400"}>
              {percentSpent.toFixed(0)}% Used Today
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 ${
                isOverspent ? "bg-red-500" : percentSpent > 80 ? "bg-amber-400" : "bg-emerald-400"
              }`}
              style={{ width: `${Math.min(100, percentSpent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Remaining Monthly Pool: <strong className="text-white">{formatCurrency(remainingMonthlyBudget, currency)}</strong></span>
            <span>Formula: <code className="text-slate-300 font-mono">Remaining Budget / Days Left</code></span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
