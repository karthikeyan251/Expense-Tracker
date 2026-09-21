"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Check, RefreshCw, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AiReallocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onReallocationApplied: () => void;
}

export const AiReallocationModal: React.FC<AiReallocationModalProps> = ({
  isOpen,
  onClose,
  userId,
  onReallocationApplied,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const fetchReallocationData = async () => {
    setLoading(true);
    setError("");
    setAppliedSuccess(false);

    try {
      const res = await fetch("/api/ai/reallocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to generate reallocation");
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReallocationData();
    }
  }, [isOpen, userId]);

  const handleApply = () => {
    setAppliedSuccess(true);
    setTimeout(() => {
      onReallocationApplied();
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  const currency = data?.user?.currency || "INR";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-white my-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Budget Reallocation</h3>
                <p className="text-xs text-slate-400">Smart recalculation for remaining days</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
              <X className="h-5 w-5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Analyzing remaining budget & calculating revised daily limit...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Today's Spending Summary Block */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Today's Spending Summary
                </h4>
                <div className="text-xs text-slate-300 space-y-1">
                  <p>You spent <strong className="text-white">{formatCurrency(data?.todaySpent || 0, currency)}</strong> today.</p>
                  <p>Your daily limit was <strong className="text-slate-200">{formatCurrency(data?.originalDailyLimit || 0, currency)}</strong>.</p>
                  {data?.isOverspent ? (
                    <p className="text-red-400 font-bold">
                      You exceeded your limit by {formatCurrency(data?.overspentAmount || 0, currency)}.
                    </p>
                  ) : (
                    <p className="text-emerald-400 font-bold">
                      You stayed within your limit today!
                    </p>
                  )}
                </div>
              </div>

              {/* AI Budget Reallocation Notice */}
              <div className="bg-gradient-to-br from-indigo-950/60 to-slate-950 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    AI Budget Reallocation Result
                  </h4>
                </div>

                <p className="text-xs text-slate-300">
                  Your remaining budget has been recalculated based on today's spending.
                </p>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Revised Daily Limit:</span>
                  <span className="text-lg font-black text-emerald-400">
                    {formatCurrency(data?.revisedDailyLimit || 0, currency)} / day
                  </span>
                </div>

                <p className="text-xs text-slate-400 italic leading-relaxed">
                  "{data?.explanation}"
                </p>
              </div>

              {/* Safety Guarantees */}
              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                <p className="font-semibold text-slate-300">⚡ Rules Enforced:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                  <li>Actual expense data strictly preserved (No transactions deleted).</li>
                  <li>Paid rent & essential commitment funds are protected.</li>
                  <li>Revised limit based on exact remaining days ({data?.daysRemaining} days remaining).</li>
                </ul>
              </div>

              {appliedSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2">
                  <Check className="h-4 w-4" /> Revised budget allocation applied successfully!
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-all"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={appliedSuccess}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Review & Apply Reallocation</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
