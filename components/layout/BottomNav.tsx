"use client";

import React from "react";
import { LayoutDashboard, PlusCircle, Upload, Bot, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
  onOpenUpload: () => void;
  onOpenAiChat: () => void;
  onOpenSettings: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  onOpenUpload,
  onOpenAiChat,
  onOpenSettings,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 px-2 py-2">
      <div className="flex items-center justify-around">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={cn(
            "flex flex-col items-center gap-1 text-[11px] font-medium transition-colors py-1 px-3 rounded-lg",
            activeTab === "dashboard" ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={onOpenQuickAdd}
          className="flex flex-col items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 py-1 px-3"
        >
          <PlusCircle className="h-5 w-5 text-emerald-400" />
          <span>Add Cash</span>
        </button>

        <button
          onClick={onOpenAiChat}
          className="flex flex-col items-center justify-center relative -top-3"
        >
          <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white border-2 border-slate-900">
            <Bot className="h-6 w-6 animate-bounce" />
          </div>
          <span className="text-[10px] font-bold text-emerald-400 mt-0.5">AI Companion</span>
        </button>

        <button
          onClick={onOpenUpload}
          className="flex flex-col items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 py-1 px-3"
        >
          <Upload className="h-5 w-5 text-indigo-400" />
          <span>Statement</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 py-1 px-3"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
};
