"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Banknote, Smartphone, CreditCard, Landmark, Check } from "lucide-react";

interface QuickCashEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  categories: string[];
  currency: string;
  onExpenseLogged: () => void;
}

export const QuickCashEntryModal: React.FC<QuickCashEntryModalProps> = ({
  isOpen,
  onClose,
  userId = "user-1",
  categories,
  currency,
  onExpenseLogged,
}) => {
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [categoryName, setCategoryName] = useState(categories[0] || "Groceries");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "GPAY_UPI" | "CARD" | "NET_BANKING">("CASH");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rebalanceToast, setRebalanceToast] = useState<string | null>(null);

  const currencySymbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : "€";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRebalanceToast(null);

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid expense amount");
      return;
    }
    if (!merchant.trim()) {
      setError("Merchant name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/expenses/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: numAmount,
          categoryName,
          merchant,
          paymentMethod,
          notes,
          source: "MANUAL_CASH",
        }),
      });


      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log expense");
      }

      if (data.rebalanceResult?.triggered && data.rebalanceResult?.messages?.length) {
        setRebalanceToast(data.rebalanceResult.messages.join(" "));
        setTimeout(() => {
          onExpenseLogged();
          onClose();
          resetForm();
        }, 2200);
      } else {
        onExpenseLogged();
        onClose();
        resetForm();
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setMerchant("");
    setNotes("");
    setError("");
    setRebalanceToast(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                +
              </div>
              <div>
                <h3 className="text-base font-bold">Add Cash / Expense</h3>
                <p className="text-xs text-slate-400">Micro-entry for manual spending</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {rebalanceToast && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-400">
                <Check className="h-4 w-4" /> Expense Logged & Budget Auto-Rebalanced!
              </p>
              <p className="text-[11px] text-slate-300">{rebalanceToast}</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Amount ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-lg font-bold text-emerald-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-lg font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Merchant */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Merchant / Paid To
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Local Dairy, HP Fuel, Cafe"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Category
              </label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "CASH", label: "Cash", icon: Banknote },
                  { id: "GPAY_UPI", label: "UPI", icon: Smartphone },
                  { id: "CARD", label: "Card", icon: CreditCard },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Evening snacks with team"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <span>Logging Expense...</span>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Log Expense
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
