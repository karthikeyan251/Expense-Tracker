"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Sparkles, User, RefreshCw } from "lucide-react";
import { DealCouponCard } from "./DealCouponCard";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  dealCards?: any[];
  timestamp: string;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onExpenseLogged?: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose, userId = "user-1", onExpenseLogged }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      sender: "ai",
      text: "👋 Hello! I am your Smart AI Financial Assistant. You can log expenses naturally (e.g. 'Spent 400 on petrol via UPI') or ask specific financial questions.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userText, userId }),
      });


      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI failed to respond");
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: data.reply || "Done!",
        dealCards: data.dealCards || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (data.expenseCreated && onExpenseLogged) {
        onExpenseLogged();
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: `⚠️ Error: ${err.message || "Could not complete request."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-white">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Gemini 2.5 Flash Companion
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              </h3>
              <p className="text-[11px] text-slate-400">Natural Language Expenses & Deal Alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
          <button
            onClick={() => setInput("Spent 450 on petrol via UPI")}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex-shrink-0 border border-slate-700/60"
          >
            ⛽ Log ₹450 Petrol
          </button>
          <button
            onClick={() => setInput("Can I buy shoes for ₹2,500 today?")}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex-shrink-0 border border-slate-700/60"
          >
            👟 Can I buy shoes for ₹2,500?
          </button>
          <button
            onClick={() => setInput("Paid 120 cash for snacks")}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex-shrink-0 border border-slate-700/60"
          >
            💵 Log ₹120 Snacks
          </button>
        </div>

        {/* Message History Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "ai" && (
                <div className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2.5 ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-medium rounded-tr-none shadow-md"
                    : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm"
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Render Deal Cards if triggered */}
                {msg.dealCards && msg.dealCards.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      🎁 Matched Platform Coupon Offers
                    </p>
                    {msg.dealCards.map((deal: any) => (
                      <DealCouponCard key={deal.id} deal={deal} />
                    ))}
                  </div>
                )}

                <span className="block text-[9px] text-slate-400 text-right opacity-75">
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === "user" && (
                <div className="h-7 w-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <RefreshCw className="h-4 w-4 text-emerald-400 animate-spin" />
              <span>Gemini AI is processing your input...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Log expense or ask financial advice..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-8 w-8 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 disabled:opacity-50 flex items-center justify-center text-white shadow-md hover:scale-105 transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </AnimatePresence>
  );
};
