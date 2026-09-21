"use client";

import React from "react";
import { Sparkles, Wallet, Settings, LogOut, User as UserIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface HeaderProps {
  monthlyIncome: number;
  currency: string;
  userName?: string;
  userEmail?: string;
  onOpenSettings: () => void;
  onOpenAiChat: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  monthlyIncome,
  currency,
  userName = "User",
  userEmail,
  onOpenSettings,
  onOpenAiChat,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3 sm:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-emerald-400">
              Smart AI Finance
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              AI Expense Manager & Budget Allocation
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* User Badge */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-3 py-1 rounded-full text-xs font-semibold text-slate-200">
            <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
            <span className="max-w-[100px] truncate">{userName}</span>
          </div>

          {/* Income Badge */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-full text-xs font-medium text-slate-200 transition-all shadow-sm"
          >
            <Wallet className="h-3.5 w-3.5 text-emerald-400" />
            <span>{monthlyIncome > 0 ? `${formatCurrency(monthlyIncome, currency)}/mo` : "Set Financials"}</span>
          </button>

          {/* AI Companion Quick Trigger */}
          <button
            onClick={onOpenAiChat}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all hover:scale-105"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Ask AI</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Financial Settings & AI Allocation"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
