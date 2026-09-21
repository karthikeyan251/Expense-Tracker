"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, Sparkles, CheckCircle, AlertTriangle, RefreshCw, Info, ArrowRight, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CategoryAlloc {
  name: string;
  pct: number;
  amount: number;
  isEssential: boolean;
  type: "Needs" | "Wants" | "Savings";
  explanation?: string;
}

interface FinancialSetupScreenProps {
  userId: string;
  initialSalary?: number;
  initialRent?: number;
  initialFixed?: number;
  initialSavings?: number;
  currency?: string;
  onSetupCompleted: () => void;
  onCancel?: () => void;
}

export const FinancialSetupScreen: React.FC<FinancialSetupScreenProps> = ({
  userId,
  initialSalary = 30000,
  initialRent = 8000,
  initialFixed = 0,
  initialSavings = 0,
  currency = "INR",
  onSetupCompleted,
  onCancel,
}) => {
  const [salary, setSalary] = useState(initialSalary > 0 ? String(initialSalary) : "30000");
  const [rent, setRent] = useState(initialRent > 0 ? String(initialRent) : "8000");
  const [fixedExpenses, setFixedExpenses] = useState(initialFixed > 0 ? String(initialFixed) : "0");
  const [savingsGoal, setSavingsGoal] = useState(initialSavings > 0 ? String(initialSavings) : "0");
  const [userCurrency, setUserCurrency] = useState(currency || "INR");

  const [allocations, setAllocations] = useState<CategoryAlloc[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [error, setError] = useState("");

  const numSalary = parseFloat(salary) || 0;
  const numRent = parseFloat(rent) || 0;
  const numFixed = parseFloat(fixedExpenses) || 0;
  const numSavings = parseFloat(savingsGoal) || 0;

  const availableMoney = Math.max(0, numSalary - numRent - numFixed);

  const totalAllocated = allocations.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const isBudgetValid = availableMoney > 0 && Math.abs(totalAllocated - availableMoney) <= 1;

  // Auto-trigger AI suggestion when salary or rent changes
  const fetchAiSuggestions = async (sal = numSalary, rnt = numRent, fix = numFixed) => {
    const avail = sal - rnt - fix;
    if (sal <= 0 || avail < 0) return;

    setAiSuggesting(true);
    setError("");

    try {
      const res = await fetch("/api/ai/suggest-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salary: sal,
          rent: rnt,
          otherFixedExpenses: fix,
          currency: userCurrency,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch AI recommendations");
      }

      if (Array.isArray(data.allocations)) {
        setAllocations(data.allocations);
      }
    } catch (err: any) {
      setError(err.message || "Could not fetch AI allocations");
    } finally {
      setAiSuggesting(false);
    }
  };

  useEffect(() => {
    fetchAiSuggestions(numSalary, numRent, numFixed);
  }, []);

  const handleSalaryOrRentChange = (newSal: number, newRent: number, newFix: number) => {
    if (newSal > 0 && newSal - newRent - newFix >= 0) {
      fetchAiSuggestions(newSal, newRent, newFix);
    }
  };

  const handleAmountChange = (index: number, newAmt: number) => {
    const updated = [...allocations];
    updated[index].amount = newAmt;
    if (availableMoney > 0) {
      updated[index].pct = Math.round((newAmt / availableMoney) * 100);
    }
    setAllocations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numSalary <= 0) {
      setError("Please enter a valid monthly salary.");
      return;
    }
    if (availableMoney < 0) {
      setError("Rent and fixed expenses cannot exceed your salary.");
      return;
    }
    if (!isBudgetValid) {
      setError(`Allocated budget total (${formatCurrency(totalAllocated, userCurrency)}) must not exceed Available Money (${formatCurrency(availableMoney, userCurrency)})`);
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
          monthlyIncome: numSalary,
          monthlyRent: numRent,
          otherFixedExpenses: numFixed,
          savingsGoal: numSavings,
          currency: userCurrency,
          customAllocations: allocations,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save financial setup");
      }

      onSetupCompleted();
    } catch (err: any) {
      setError(err.message || "Failed to save setup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Financial Setup & AI Allocation</h2>
              <p className="text-xs text-slate-400">Enter your salary and rent to calculate available money and generate AI budgets.</p>
            </div>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            {/* Salary */}
            <div>
              <label className="block text-xs font-bold text-emerald-400 mb-1">
                Monthly Salary *
              </label>
              <input
                type="number"
                value={salary}
                onChange={(e) => {
                  setSalary(e.target.value);
                  handleSalaryOrRentChange(parseFloat(e.target.value) || 0, numRent, numFixed);
                }}
                placeholder="30000"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* Rent */}
            <div>
              <label className="block text-xs font-bold text-indigo-400 mb-1">
                Monthly Rent *
              </label>
              <input
                type="number"
                value={rent}
                onChange={(e) => {
                  setRent(e.target.value);
                  handleSalaryOrRentChange(numSalary, parseFloat(e.target.value) || 0, numFixed);
                }}
                placeholder="8000"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Other Fixed */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Other Fixed (Optional)
              </label>
              <input
                type="number"
                value={fixedExpenses}
                onChange={(e) => {
                  setFixedExpenses(e.target.value);
                  handleSalaryOrRentChange(numSalary, numRent, parseFloat(e.target.value) || 0);
                }}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-slate-500"
              />
            </div>

            {/* Savings Goal */}
            <div>
              <label className="block text-xs font-semibold text-amber-400 mb-1">
                Savings Goal (Optional)
              </label>
              <input
                type="number"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Calculation Display Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs text-slate-400 font-medium">Available Money Formula</span>
              <div className="text-sm font-mono text-slate-300">
                {formatCurrency(numSalary, userCurrency)} (Salary) - {formatCurrency(numRent, userCurrency)} (Rent) - {formatCurrency(numFixed, userCurrency)} (Fixed)
              </div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 px-5 py-2.5 rounded-xl text-center">
              <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">Available Money</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400">
                {formatCurrency(availableMoney, userCurrency)}
              </span>
            </div>
          </div>

          {/* AI Allocation Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">AI Suggested Budget Allocation</h3>
            </div>

            <button
              type="button"
              onClick={() => fetchAiSuggestions(numSalary, numRent, numFixed)}
              disabled={aiSuggesting || availableMoney <= 0}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              {aiSuggesting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  <span>AI Recalculating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                  <span>Recalculate AI Allocation</span>
                </>
              )}
            </button>
          </div>

          {/* Categories Grid */}
          {allocations.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {allocations.map((alloc, idx) => (
                <div
                  key={alloc.name}
                  className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{alloc.name}</span>
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
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">{alloc.pct}%</span>
                      <div className="relative w-32">
                        <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">
                          {userCurrency === "INR" ? "₹" : "$"}
                        </span>
                        <input
                          type="number"
                          value={alloc.amount}
                          onChange={(e) => handleAmountChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-2 py-1 text-xs font-bold text-white text-right focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {alloc.explanation && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Info className="h-3 w-3 text-indigo-400 shrink-0" />
                      <span>{alloc.explanation}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs space-y-2">
              <Sparkles className="h-6 w-6 text-emerald-400 mx-auto animate-pulse" />
              <p>Enter your salary and rent above to generate dynamic AI allocations for your available money.</p>
            </div>
          )}

          {/* Validation Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-400">
              Total Allocation: <strong className="text-white">{formatCurrency(totalAllocated, userCurrency)}</strong> / <span className="text-emerald-400 font-bold">{formatCurrency(availableMoney, userCurrency)}</span>
            </div>

            <div
              className={`text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
                isBudgetValid
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              {isBudgetValid ? (
                <>
                  <CheckCircle className="h-4 w-4" /> 100% Budget Allocated
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" /> Allocation check ({formatCurrency(totalAllocated, userCurrency)})
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || availableMoney < 0 || !isBudgetValid}
            className="w-full bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <span>Saving Setup...</span>
            ) : (
              <>
                <span>Accept Budget & Launch Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
