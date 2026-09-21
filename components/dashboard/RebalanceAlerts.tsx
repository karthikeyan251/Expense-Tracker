"use client";

import React from "react";
import { RefreshCw, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RebalanceLog {
  id: string;
  fromCategory?: { categoryName: string };
  toCategory?: { categoryName: string };
  amountReallocated: number;
  reason: string;
  timestamp: string;
}

interface RebalanceAlertsProps {
  logs: RebalanceLog[];
  currency: string;
}

export const RebalanceAlerts: React.FC<RebalanceAlertsProps> = ({ logs, currency }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <RefreshCw className="h-4 w-4 text-indigo-400 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Dynamic Rebalancing Log</h2>
            <p className="text-xs text-slate-400">Automatic Wants → Overspent Needs Reallocations</p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Savings Protected
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="flex items-center gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <span>
            No overspending detected yet. If a category exceeds 100%, our engine will dynamically shift non-essential funds to protect your Savings.
          </span>
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-950/80 border border-indigo-500/30 p-3.5 rounded-xl text-xs space-y-2 shadow-md relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-emerald-500" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <span className="text-red-400 font-bold">
                    {log.fromCategory?.categoryName || "Wants"}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-emerald-400 font-bold">
                    {log.toCategory?.categoryName || "Overspent Category"}
                  </span>
                </div>
                <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded text-[11px]">
                  +{formatCurrency(log.amountReallocated, currency)}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">{log.reason}</p>
              <p className="text-[10px] text-slate-500">
                {new Date(log.timestamp).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
