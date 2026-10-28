import React from 'react';
import { TrendingDown, TrendingUp, Minus, ShieldCheck, Info } from 'lucide-react';
import { PriceAnalysis } from '../../services/assistantService';

interface PriceTrendBadgeProps {
  analysis: PriceAnalysis;
  compact?: boolean;
}

export const PriceTrendBadge: React.FC<PriceTrendBadgeProps> = ({ analysis, compact = false }) => {
  if (analysis.error) {
    return (
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
        <Info className="w-4 h-4 shrink-0 text-amber-600" />
        <span>{analysis.error}</span>
      </div>
    );
  }

  const isCheaper = analysis.trend === 'CHEAPER';
  const isMoreExpensive = analysis.trend === 'MORE_EXPENSIVE';
  const isStable = analysis.trend === 'STABLE';

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          isCheaper
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : isMoreExpensive
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-slate-100 text-slate-700 border border-slate-200'
        }`}
      >
        {isCheaper && <TrendingDown className="w-3.5 h-3.5" />}
        {isMoreExpensive && <TrendingUp className="w-3.5 h-3.5" />}
        {isStable && <Minus className="w-3.5 h-3.5" />}
        <span>
          {isCheaper && `Cheaper by ₹${Math.abs(analysis.diff_vs_thirty_day_avg).toLocaleString()} (${Math.abs(analysis.pct_vs_thirty_day_avg)}%)`}
          {isMoreExpensive && `Up by ₹${Math.abs(analysis.diff_vs_thirty_day_avg).toLocaleString()} (+${Math.abs(analysis.pct_vs_thirty_day_avg)}%)`}
          {isStable && 'Price is stable'}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-2.5 my-2 shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              isCheaper
                ? 'bg-emerald-100 text-emerald-700'
                : isMoreExpensive
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {isCheaper && <TrendingDown className="w-3.5 h-3.5" />}
            {isMoreExpensive && <TrendingUp className="w-3.5 h-3.5" />}
            {isStable && <Minus className="w-3.5 h-3.5" />}
          </div>
          <div>
            <span className="font-bold text-slate-900 block text-xs">
              {isCheaper && 'Price Drop Detected'}
              {isMoreExpensive && 'Price Higher Than Average'}
              {isStable && 'Stable Historical Price'}
            </span>
            <span className="text-[11px] text-slate-500">
              {analysis.title}
            </span>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            isCheaper
              ? 'bg-emerald-600 text-white'
              : isMoreExpensive
              ? 'bg-amber-600 text-white'
              : 'bg-slate-600 text-white'
          }`}
        >
          {analysis.trend}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center bg-white p-2 rounded-lg border border-slate-200">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Current</span>
          <span className="font-bold text-slate-900 text-xs">₹{analysis.current_price.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">30d Average</span>
          <span className="font-semibold text-slate-700 text-xs">₹{analysis.thirty_day_avg_price.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Last Month</span>
          <span className="font-semibold text-slate-700 text-xs">₹{analysis.last_month_same_day_price.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600 mt-0.5" />
        <span>{analysis.history_disclosure}</span>
      </div>
    </div>
  );
};
