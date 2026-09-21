"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, Lock, Sparkles, CheckCircle } from "lucide-react";

interface StatementUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onStatementParsed: () => void;
}

export const StatementUploadModal: React.FC<StatementUploadModalProps> = ({
  isOpen,
  onClose,
  userId = "user-1",
  onStatementParsed,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF or CSV bank statement file");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", password);
      formData.append("userId", userId);

      const res = await fetch("/api/statements/parse", {
        method: "POST",
        body: formData,
      });


      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse bank statement");
      }

      setResult(data);
      setTimeout(() => {
        onStatementParsed();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to process bank statement");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Ingest Bank Statement</h3>
                <p className="text-xs text-slate-400">Digital PDF / CSV auto-parsing via Gemini AI</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {result ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
              <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-emerald-400">
                Extracted {result.extractedCount} debit transactions successfully!
              </p>
              <p className="text-xs text-slate-300">
                Expenses have been added to your budget and dynamic rebalancing has been checked.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-950/50 transition-colors cursor-pointer relative"
              >
                <input
                  type="file"
                  accept=".pdf,.csv,.txt"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-indigo-400 animate-bounce" />
                  {file ? (
                    <div className="text-xs font-semibold text-emerald-400">
                      📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-slate-200">
                        Drag and drop your bank PDF or CSV statement here
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Supports HDFC, ICICI, SBI, Axis, Paytm, and standard CSV format files
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* PDF Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  PDF Password (If password-protected)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. PAN card number or DOB"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" /> Extracting line items via AI...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Parse & Ingest Statement
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
