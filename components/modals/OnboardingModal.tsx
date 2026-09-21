"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Sliders, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CategoryAlloc {
  name: string;
  pct: number;
  isEssential: boolean;
  type: "Needs" | "Wants" | "Savings";
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  currentIncome: number;
  currentCurrency: string;
  onSetupSaved: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  userId = "user-1",
  currentIncome,
  currentCurrency,
  onSetupSaved,
}) => {
  const [income, setIncome] = useState(currentIncome > 0 ? String(currentIncome) : "");
  const [currency, setCurrency] = useState(currentCurrency || "INR");
  const [allocations, setAllocations] = useState<CategoryAlloc[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [error, setError] = useState("");

  const numIncome = parseFloat(income) || 0;
  const totalPct = allocations.reduce((acc, curr) => acc + curr.pct, 0);
  const is100PctValid = Math.abs(totalPct - 100) < 0.5 && allocations.length > 0;

  // Auto-fetch AI suggestions when modal opens or when income changes
  const handleAiSuggest = async (amountToUse?: number) => {
    const val = amountToUse !== undefined ? amountToUse : numIncome;
    if (val <= 0) {
      setError("Please enter your monthly income/money first to generate AI allocations.");
      return;
    }

    setAiSuggesting(true);
    setError("");
    try {
      const res = await fetch("/api/ai/suggest-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ income: val, currency }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate AI suggestions");
      }
      if (Array.isArray(data.allocations)) {
        setAllocations(data.allocations);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch AI budget allocation");
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleSliderChange = (index: number, newPct: number) => {
    const updated = [...allocations];
    updated[index].pct = newPct;
    setAllocations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numIncome <= 0) {
      setError("Please enter a valid monthly income.");
      return;
    }
    if (!is100PctValid) {
      setError(`Category allocations must total 100% (currently ${totalPct.toFixed(1)}%)`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          monthlyIncome: numIncome,
          currency,
          customAllocations: allocations,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save budget settings");
      }

      onSetupSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update setup");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-white my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Income & Smart Budget Allocator</h3>
                <p className="text-xs text-slate-400">Enter your monthly income first, then let AI suggest category allocations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Income Input */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-semibold text-emerald-400">
                  Step 1: Enter Your Monthly Income / Money
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-lg font-bold text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            {/* Step 2: AI Suggest Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleAiSuggest()}
                disabled={aiSuggesting || numIncome <= 0}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 hover:from-emerald-500/30 hover:to-indigo-500/30 text-emerald-400 border border-emerald-500/40 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {aiSuggesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> AI Analyzing Income...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Step 2: AI Suggest Allocation for {formatCurrency(numIncome, currency)}
                  </>
                )}
              </button>

              <div
                className={`text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
                  is100PctValid
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                {is100PctValid ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5" /> Aggregate: 100%
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5" /> Total: {totalPct.toFixed(0)}% (Target: 100%)
                  </>
                )}
              </div>
            </div>

            {/* Category Sliders */}
            {allocations.length > 0 ? (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {allocations.map((alloc, idx) => {
                  const allocatedVal = ((numIncome * alloc.pct) / 100).toFixed(0);
                  return (
                    <div
                      key={alloc.name}
                      className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-white flex items-center gap-2">
                          {alloc.name}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              alloc.type === "Needs"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : alloc.type === "Wants"
                                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {alloc.type} ({alloc.isEssential ? "Essential" : "Reallocatable"})
                          </span>
                        </span>
                        <span className="text-slate-300">
                          {alloc.pct}% ({formatCurrency(allocatedVal, currency)})
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="60"
                        step="1"
                        value={alloc.pct}
                        onChange={(e) => handleSliderChange(idx, Number(e.target.value))}
                        className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-400 text-xs">
                Enter your monthly income above and click <span className="text-emerald-400 font-semibold">"AI Suggest Allocation"</span> to automatically generate custom category budgets.
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || numIncome <= 0 || !is100PctValid}
              className="w-full bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading ? "Saving Settings..." : "Save Budget & Initialize Engine"}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

