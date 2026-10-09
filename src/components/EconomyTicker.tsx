import React from 'react';
import { EconomicCondition } from '../types/game';
import { TrendingUp, Percent, AlertCircle } from 'lucide-react';

interface EconomyTickerProps {
  condition: EconomicCondition;
  turnCountdown: number;
  currentRound?: number;
  maxRounds?: number;
}

export const EconomyTicker: React.FC<EconomyTickerProps> = ({
  condition,
  turnCountdown,
  currentRound = 1,
  maxRounds = 50
}) => {
  return (
    <div className="w-full bg-amber-100/90 border-2 border-slate-900 rounded-xl p-2.5 px-3 sm:px-4 shadow-sm flex flex-wrap items-center justify-between gap-2.5 text-xs">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <span className="p-1 sm:p-1.5 bg-white rounded-lg border border-slate-900 text-sm sm:text-base shadow-xs shrink-0">
          📊
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Dinamika Ekonomi RI
            </span>
            <span className={`px-1.5 sm:px-2 py-0.2 rounded-md font-bold text-[10px] sm:text-[11px] border ${condition.badgeColor}`}>
              {condition.title}
            </span>
            <span className="bg-slate-900 text-yellow-300 font-bold px-1.5 sm:px-2 py-0.2 rounded text-[9px] sm:text-[10px] uppercase tracking-wider font-comic">
              🎯 Target: Rp 100 Jt / Putaran {currentRound} dari {maxRounds}
            </span>
          </div>
          <p className="text-slate-700 font-medium text-[10px] sm:text-[11px] mt-0.5 line-clamp-1">
            {condition.description}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] font-medium">
        <div className="flex items-center gap-1 text-slate-800">
          <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          <span>Sewa: <strong className="font-bold font-mono">{(condition.rentMultiplier * 100).toFixed(0)}%</strong></span>
        </div>
        <div className="flex items-center gap-1 text-slate-800">
          <Percent className="w-3.5 h-3.5 text-amber-600" />
          <span>Pajak: <strong className="font-bold font-mono">{(condition.taxMultiplier * 100).toFixed(0)}%</strong></span>
        </div>
        <div className="flex items-center gap-1 text-slate-600 bg-white/80 py-0.5 px-2 rounded-md border border-slate-300">
          <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
          <span>Rotasi dalam <strong className="text-slate-900 font-bold">{turnCountdown}</strong> giliran</span>
        </div>
      </div>
    </div>
  );
};
