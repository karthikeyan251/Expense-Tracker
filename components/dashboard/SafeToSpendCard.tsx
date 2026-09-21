"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Calendar, Info, ArrowUpRight, Flame } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SafeToSpendCardProps {
  dailySafeSpend: number;
  daysRemaining: number;
  currency: string;
  totalWantsAllocated: number;
  totalWantsSpent: number;
}

export const SafeToSpendCard: React.FC<SafeToSpendCardProps> = ({
  dailySafeSpend,
  daysRemaining,
  currency = "INR",
  totalWantsAllocated,
  totalWantsSpent,
}) => {
  const remainingWants = Math.max(0, totalWantsAllocated - totalWantsSpent);
  const percentSpent = totalWantsAllocated > 0 ? (totalWantsSpent / totalWantsAllocated) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 shadow-xl shadow-black/40"
    >
      {/* Background Ambient Glow */}
      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        {/* Left Column: Hero Counter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Daily Safe-to-Spend Limit
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              {daysRemaining} Days Left
            </span>
          </div>

          <div className="flex items-baseline gap-3 pt-1">
            <span className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              {formatCurrency(dailySafeSpend, currency)}
            </span>
            <span className="text-sm font-medium text-slate-400">/ day</span>
          </div>

          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            Real-time safe daily limit calculated from your remaining non-essential &quot;Wants&quot; budget.
            Spending within this limit protects your Essential Savings.
          </p>
        </div>

        {/* Right Column: Dynamic Breakdown Stats */}
        <div className="flex flex-col sm:flex-row gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div className="space-y-1 pr-4 sm:border-r border-slate-800">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Remaining Wants Pool
            </p>
            <p className="text-lg font-bold text-white">
              {formatCurrency(remainingWants, currency)}
            </p>
            <p className="text-[10px] text-slate-500">
              Out of {formatCurrency(totalWantsAllocated, currency)} allocated
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Pacing Status
            </p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    percentSpent > 90
                      ? "bg-red-500"
                      : percentSpent > 70
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                  }`}
                  style={{ width: `${Math.min(100, percentSpent)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-300">
                {percentSpent.toFixed(0)}% Spent
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              {percentSpent > 80 ? "⚠️ High spending velocity" : "✅ On budget trajectory"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
