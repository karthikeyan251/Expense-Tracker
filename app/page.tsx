"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { DailySpendingCard } from "@/components/dashboard/DailySpendingCard";
import { OverspendingAlertCard } from "@/components/dashboard/OverspendingAlertCard";
import { DailySpendingSummaryCard } from "@/components/dashboard/DailySpendingSummaryCard";
import { AllocationPieChart } from "@/components/dashboard/AllocationPieChart";
import { BudgetvsActualBarChart } from "@/components/dashboard/BudgetvsActualBarChart";
import { RecentExpenses } from "@/components/dashboard/RecentExpenses";
import { RebalanceAlerts } from "@/components/dashboard/RebalanceAlerts";
import { QuickCashEntryModal } from "@/components/modals/QuickCashEntryModal";
import { StatementUploadModal } from "@/components/modals/StatementUploadModal";
import { FinancialSetupScreen } from "@/components/onboarding/FinancialSetupScreen";
import { AiReallocationModal } from "@/components/modals/AiReallocationModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { ChatDrawer } from "@/components/ai/ChatDrawer";
import { DealCouponCard } from "@/components/ai/DealCouponCard";
import { Sparkles, PlusCircle, Upload, Sliders, RefreshCw, Tag, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Modal Visibility States
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReallocationModalOpen, setIsReallocationModalOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  // Check auth on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem("expense_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.id) {
          setCurrentUser(user);
        }
      }
    } catch (e) {
      console.error("Auth check error:", e);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  const fetchStats = useCallback(async (targetUserId = currentUser?.id) => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?userId=${encodeURIComponent(targetUserId)}`);
      const data = await res.json();
      if (res.ok) {
        setStats(data);
        if (data.needsSetup || !data.user?.monthlyIncome || data.user.monthlyIncome <= 0 || !data.user?.monthlyRent) {
          setShowSetup(true);
        }
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchStats(currentUser.id);
    }
  }, [currentUser, fetchStats]);

  const handleLoginSuccess = (user: any, needsSetup: boolean) => {
    setCurrentUser(user);
    if (needsSetup) {
      setShowSetup(true);
    } else {
      setShowSetup(false);
      fetchStats(user.id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("expense_user");
    setCurrentUser(null);
    setStats(null);
    setShowSetup(false);
  };

  const handleFinancialSetupCompleted = () => {
    setShowSetup(false);
    if (currentUser?.id) {
      fetchStats(currentUser.id);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3 text-white">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Initializing AI Expense Manager...</p>
      </div>
    );
  }

  // 1. Auth View (If not logged in)
  if (!currentUser) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Financial Setup View (If required or opened manually)
  if (showSetup) {
    return (
      <FinancialSetupScreen
        userId={currentUser.id}
        initialSalary={stats?.user?.monthlyIncome || currentUser.monthlyIncome || 30000}
        initialRent={stats?.user?.monthlyRent || currentUser.monthlyRent || 8000}
        initialFixed={stats?.user?.otherFixedExpenses || currentUser.otherFixedExpenses || 0}
        initialSavings={stats?.user?.savingsGoal || currentUser.savingsGoal || 0}
        currency={stats?.user?.currency || currentUser.currency || "INR"}
        onSetupCompleted={handleFinancialSetupCompleted}
        onCancel={stats?.needsSetup ? undefined : () => setShowSetup(false)}
      />
    );
  }

  const categoryNames = stats?.budgets?.map((b: any) => b.categoryName) || [
    "Food",
    "Transportation",
    "Shopping",
    "Bills",
    "Entertainment",
    "Savings",
    "Other Needs",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        monthlyIncome={stats?.user?.monthlyIncome || 0}
        currency={stats?.user?.currency || "INR"}
        userName={currentUser?.name || "User"}
        userEmail={currentUser?.email}
        onOpenSettings={() => setShowSetup(true)}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-8">
        {/* Desktop Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenAiChat={() => setIsAiChatOpen(true)}
          onOpenSettings={() => setShowSetup(true)}
        />

        {/* Main Dashboard Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
          {/* Action Pills Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Smart Engine Active</span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-slate-400 hidden sm:inline">
                User: <strong className="text-white">{currentUser?.name || currentUser?.email}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              >
                <PlusCircle className="h-3.5 w-3.5" /> + Add Expense
              </button>

              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              >
                <Upload className="h-3.5 w-3.5" /> Ingest Statement
              </button>

              <button
                onClick={() => setShowSetup(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              >
                <Sliders className="h-3.5 w-3.5" /> Financial Setup
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Loading Real-time Analytics...</p>
            </div>
          ) : activeTab === "deals" ? (
            /* Deals Tab View */
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Tag className="h-5 w-5 text-emerald-400" /> Localized Deal Coupons & Offers
                </h2>
                <p className="text-xs text-slate-400">
                  Recommended automatically when category budget drops below 20%
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats?.activeDeals?.map((deal: any) => (
                  <DealCouponCard key={deal.id} deal={deal} />
                ))}
              </div>
            </div>
          ) : (
            /* Main Dashboard View */
            <>
              {/* Overspending Warning Banner */}
              {stats?.isOverspentToday && (
                <OverspendingAlertCard
                  overspentAmount={stats?.overspentAmount || 0}
                  todaySpent={stats?.todaySpent || 0}
                  todayDailyLimit={stats?.todayDailyLimit || 0}
                  currency={stats?.user?.currency || "INR"}
                  onTriggerReallocation={() => setIsReallocationModalOpen(true)}
                />
              )}

              {/* Requirement 4 & 5: Daily Spending Limit Hero Card */}
              <DailySpendingCard
                todayDailyLimit={stats?.todayDailyLimit || 0}
                todaySpent={stats?.todaySpent || 0}
                remainingToday={stats?.remainingToday || 0}
                daysRemaining={stats?.daysRemaining || 15}
                availableMoney={stats?.availableMoney || 0}
                remainingMonthlyBudget={stats?.remainingMonthlyBudget || 0}
                currency={stats?.user?.currency || "INR"}
                isOverspent={Boolean(stats?.isOverspentToday)}
                overspentAmount={stats?.overspentAmount || 0}
              />

              {/* Requirement 8: Daily AI Spending Summary */}
              <DailySpendingSummaryCard
                todaySpent={stats?.todaySpent || 0}
                originalDailyLimit={stats?.todayDailyLimit || 0}
                overspentAmount={stats?.overspentAmount || 0}
                isOverspent={Boolean(stats?.isOverspentToday)}
                remainingToday={stats?.remainingToday || 0}
                remainingMonthlyBudget={stats?.remainingMonthlyBudget || 0}
                revisedDailyLimit={stats?.todayDailyLimit || 0}
                categoryBreakdownToday={stats?.categoryBreakdownToday || []}
                currency={stats?.user?.currency || "INR"}
              />

              {/* Visual Analytics Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AllocationPieChart
                  data={stats?.charts?.pieChartData || []}
                  currency={stats?.user?.currency || "INR"}
                />
                <BudgetvsActualBarChart
                  data={stats?.charts?.barChartData || []}
                  currency={stats?.user?.currency || "INR"}
                />
              </div>

              {/* Transactions & Rebalance Audit Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentExpenses
                  expenses={stats?.recentExpenses || []}
                  currency={stats?.user?.currency || "INR"}
                />
                <RebalanceAlerts
                  logs={stats?.rebalanceAudit || []}
                  currency={stats?.user?.currency || "INR"}
                />
              </div>
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        onOpenSettings={() => setShowSetup(true)}
      />

      {/* Modals & AI Chat Drawer */}
      <QuickCashEntryModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        userId={currentUser.id}
        categories={categoryNames}
        currency={stats?.user?.currency || "INR"}
        onExpenseLogged={fetchStats}
      />

      <StatementUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        userId={currentUser.id}
        onStatementParsed={fetchStats}
      />

      <AiReallocationModal
        isOpen={isReallocationModalOpen}
        onClose={() => setIsReallocationModalOpen(false)}
        userId={currentUser.id}
        onReallocationApplied={fetchStats}
      />

      <ChatDrawer
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        userId={currentUser.id}
        onExpenseLogged={fetchStats}
      />
    </div>
  );
}
