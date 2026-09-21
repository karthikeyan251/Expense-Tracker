"use client";

import React from "react";
import { LayoutDashboard, PlusCircle, Upload, Bot, Settings, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAdd: () => void;
  onOpenUpload: () => void;
  onOpenAiChat: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  onOpenUpload,
  onOpenAiChat,
  onOpenSettings,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, action: () => setActiveTab("dashboard") },
    { id: "quick-entry", label: "Quick Cash Entry", icon: PlusCircle, action: onOpenQuickAdd },
    { id: "upload-statement", label: "Upload Statement", icon: Upload, action: onOpenUpload },
    { id: "ai-assistant", label: "AI Assistant", icon: Bot, action: onOpenAiChat },
    { id: "deals", label: "Deal Coupons", icon: Tag, action: () => setActiveTab("deals") },
    { id: "settings", label: "Settings", icon: Settings, action: onOpenSettings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-61px)] p-4 text-slate-300">
      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-emerald-400" : "text-slate-400")} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/80">
          <p className="text-xs font-semibold text-slate-300">Smart Budget Engine</p>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Non-essential category overspending is dynamically reallocated to protect your essential savings.
          </p>
        </div>
      </div>
    </aside>
  );
};

