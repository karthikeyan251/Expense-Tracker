"use client";

import React, { useState } from "react";
import { Tag, Copy, ExternalLink, Check } from "lucide-react";

interface Deal {
  id: string;
  platformName: string;
  category: string;
  title: string;
  promoCode?: string | null;
  discountPercentage?: number | null;
  affiliateUrl: string;
}

interface DealCouponCardProps {
  deal: Deal;
}

export const DealCouponCard: React.FC<DealCouponCardProps> = ({ deal }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (deal.promoCode) {
      navigator.clipboard.writeText(deal.promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 p-3.5 rounded-xl space-y-2 shadow-lg hover:border-emerald-500/60 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          {deal.platformName} • {deal.category}
        </span>
        {deal.discountPercentage && (
          <span className="text-xs font-extrabold text-amber-400">
            {deal.discountPercentage}% OFF
          </span>
        )}
      </div>

      <p className="text-xs font-bold text-white leading-snug">{deal.title}</p>

      <div className="flex items-center justify-between pt-1 gap-2">
        {deal.promoCode ? (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-slate-400" /> {deal.promoCode}
              </>
            )}
          </button>
        ) : (
          <span className="text-[11px] text-slate-400">No code required</span>
        )}

        <a
          href={deal.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Redeem <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};
