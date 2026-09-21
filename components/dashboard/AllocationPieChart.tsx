"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface PieChartItem {
  name: string;
  value: number;
  isEssential: boolean;
  type: "Needs" | "Wants" | "Savings";
}

interface AllocationPieChartProps {
  data: PieChartItem[];
  currency: string;
}

const COLORS: Record<string, string[]> = {
  Needs: ["#10B981", "#059669", "#047857"], // Emerald shades
  Wants: ["#6366F1", "#4F46E5", "#4338CA"], // Indigo shades
  Savings: ["#F59E0B", "#D97706", "#B45309"], // Amber/Gold shades
};

export const AllocationPieChart: React.FC<AllocationPieChartProps> = ({ data, currency }) => {
  // Color assignment helper
  const getColor = (entry: PieChartItem, index: number) => {
    const palette = COLORS[entry.type] || COLORS.Needs;
    return palette[index % palette.length];
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as PieChartItem;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-white">{item.name}</p>
          <p className="text-slate-300">
            Type: <span className="font-semibold text-emerald-400">{item.type}</span>
          </p>
          <p className="text-slate-300">
            Allocated: <span className="font-bold text-white">{formatCurrency(item.value, currency)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white">50/30/20 Salary Allocation</h2>
          <p className="text-xs text-slate-400">Target budget split across Needs, Wants & Savings</p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Needs (50%)
          </span>
          <span className="flex items-center gap-1 text-indigo-400 font-semibold">
            <span className="h-2 w-2 rounded-full bg-indigo-500" /> Wants (30%)
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-semibold">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Savings (20%)
          </span>
        </div>
      </div>

      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry, index)} stroke="#0F172A" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
