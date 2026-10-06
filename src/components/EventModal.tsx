import React from 'react';
import { EventCard, Player } from '../types/game';
import { formatRupiah } from '../utils/formatters';
import { Check, ShieldCheck, Siren, Gift, Sparkles } from 'lucide-react';

interface EventModalProps {
  card: EventCard | null;
  player: Player;
  onConfirm: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  card,
  player,
  onConfirm
}) => {
  if (!card) return null;

  const isPositiveMoney = card.moneyChange > 0;
  const isNegativeMoney = card.moneyChange < 0;

  const getCategoryStyles = () => {
    switch (card.category) {
      case 'RAZIA':
        return {
          bg: 'bg-rose-600',
          title: 'RAZIA OPERASI POLISI',
          icon: <Siren className="w-6 h-6 text-white animate-pulse" />
        };
      case 'ARISAN':
        return {
          bg: 'bg-amber-500',
          title: 'ARISAN WARGA RT',
          icon: <Gift className="w-6 h-6 text-white animate-bounce" />
        };
      case 'KESEMPATAN':
        return {
          bg: 'bg-indigo-600',
          title: 'KARTU KESEMPATAN BIROKRASI',
          icon: <Sparkles className="w-6 h-6 text-white" />
        };
      case 'NASIB':
      default:
        return {
          bg: 'bg-blue-600',
          title: 'KARTU NASIB WARGA WNI',
          icon: <ShieldCheck className="w-6 h-6 text-white" />
        };
    }
  };

  const style = getCategoryStyles();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-amber-50 rounded-2xl comic-box-lg max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className={`${style.bg} p-4 text-white flex items-center gap-3`}>
          <div className="p-2 bg-white/20 rounded-xl">{style.icon}</div>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold opacity-80">{style.title}</p>
            <h3 className="text-lg font-bold font-comic leading-tight">{card.title}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="bg-white p-4 rounded-xl comic-box-sm">
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              "{card.description}"
            </p>
          </div>

          {/* Consequence Box */}
          <div className="p-3.5 bg-amber-100 rounded-xl border border-amber-300 space-y-2">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Akibat bagi {player.name}:
            </p>
            <p className="text-xs font-semibold text-slate-900">
              {card.effectDescription}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {isPositiveMoney && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded border border-emerald-300">
                  +{formatRupiah(card.moneyChange)}
                </span>
              )}
              {isNegativeMoney && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-xs rounded border border-rose-300">
                  {formatRupiah(card.moneyChange)}
                </span>
              )}
              {card.karmaChange !== 0 && (
                <span className={`px-2 py-0.5 font-bold text-xs rounded border ${
                  card.karmaChange > 0 
                    ? 'bg-rose-100 text-rose-800 border-rose-300' 
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  Karma: {card.karmaChange > 0 ? `+${card.karmaChange}%` : `${card.karmaChange}%`}
                </span>
              )}
              {card.goToJail && (
                <span className="px-2 py-0.5 bg-slate-900 text-yellow-300 font-bold text-xs rounded">
                  ⛓️ Dijebloskan ke Sukamiskin!
                </span>
              )}
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl comic-box-sm comic-btn-hover flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            Laksanakan & Lanjut Main
          </button>
        </div>
      </div>
    </div>
  );
};
