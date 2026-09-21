"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface BarChartItem {
  category: string;
  Allocated: number;
  Spent: number;
  isOverbudget: boolean;
  isEssential: boolean;
}

interface BudgetvsActualBarChartProps {
  data: BarChartItem[];
  currency: string;
}

export const BudgetvsActualBarChart: React.FC<BudgetvsActualBarChartProps> = ({ data, currency }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = data.find((d) => d.category === label);
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-white">{label}</p>
          <p className="text-slate-300">
            Target Allocated: <span className="font-bold text-slate-200">{formatCurrency(item?.Allocated || 0, currency)}</span>
          </p>
          <p className="text-slate-300">
            Actual Spent:{" "}
            <span
              className={`font-bold ${
                item?.isOverbudget ? "text-red-400 font-black" : "text-emerald-400"
              }`}
            >
              {formatCurrency(item?.Spent || 0, currency)}
            </span>
          </p>
          {item?.isOverbudget && (
            <p className="text-red-400 font-bold text-[10px] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
              🚨 Overbudget - Dynamic Rebalancing Triggered!
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white">Budget vs. Actual Spent</h2>
          <p className="text-xs text-slate-400">
            Side-by-side comparison. Bars in Coral Red (#EF4444) indicate overbudget categories.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="h-3 w-3 rounded bg-slate-600" /> Target Allocated
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-3 w-3 rounded bg-emerald-500" /> On Track
          </span>
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="h-3 w-3 rounded bg-red-500 animate-pulse" /> Overbudget (#EF4444)
          </span>
        </div>
      </div>

      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="category" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Allocated" fill="#475569" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Bar dataKey="Spent" radius={[4, 4, 0, 0]} maxBarSize={30}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-spent-${index}`}
                  fill={entry.isOverbudget ? "#EF4444" : "#10B981"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
