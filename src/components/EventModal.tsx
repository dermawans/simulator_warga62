import React, { useState, useEffect } from 'react';
import { EventCard, Player } from '../types/game';
import { formatRupiah } from '../utils/formatters';
import { soundManager } from '../utils/audio';
import { Check, ShieldCheck, Siren, Gift, Sparkles, RotateCw, Layers } from 'lucide-react';

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
  const [animKey, setAnimKey] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(true);
  const [showCardBack, setShowCardBack] = useState<boolean>(false);

  useEffect(() => {
    if (!card) return;

    // Trigger initial Card Draw & Spin sound sequence
    soundManager.playCardDraw();
    const spinTimer = setTimeout(() => {
      soundManager.playCardSpin();
    }, 180);

    setIsSpinning(true);
    setShowCardBack(false);

    const finishAnimTimer = setTimeout(() => {
      setIsSpinning(false);
    }, 1100);

    return () => {
      clearTimeout(spinTimer);
      clearTimeout(finishAnimTimer);
    };
  }, [card, animKey]);

  if (!card) return null;

  const isPositiveMoney = card.moneyChange > 0;
  const isNegativeMoney = card.moneyChange < 0;

  const getCategoryTheme = () => {
    switch (card.category) {
      case 'RAZIA':
        return {
          bg: 'bg-rose-600',
          gradientHeader: 'from-rose-600 via-red-600 to-rose-700',
          deckColor: 'bg-rose-700',
          borderAccent: 'border-rose-400',
          title: 'RAZIA OPERASI POLISI',
          subtitle: 'KARTU RAZIA KELILING',
          backLabel: 'RAZIA GABUNGAN',
          icon: <Siren className="w-6 h-6 text-yellow-300 animate-pulse" />
        };
      case 'ARISAN':
        return {
          bg: 'bg-amber-500',
          gradientHeader: 'from-amber-500 via-yellow-500 to-amber-600',
          deckColor: 'bg-amber-600',
          borderAccent: 'border-amber-400',
          title: 'ARISAN WARGA RT',
          subtitle: 'KARTU REZEKI NOMPLOK',
          backLabel: 'ARISAN WARGA 62',
          icon: <Gift className="w-6 h-6 text-white animate-bounce" />
        };
      case 'KESEMPATAN':
        return {
          bg: 'bg-indigo-600',
          gradientHeader: 'from-indigo-600 via-purple-600 to-indigo-700',
          deckColor: 'bg-indigo-700',
          borderAccent: 'border-indigo-400',
          title: 'KARTU KESEMPATAN BIROKRASI',
          subtitle: 'KESEMPATAN EMAS SULTAN',
          backLabel: 'KESEMPATAN 62',
          icon: <Sparkles className="w-6 h-6 text-yellow-300 animate-spin-slow" />
        };
      case 'NASIB':
      default:
        return {
          bg: 'bg-blue-600',
          gradientHeader: 'from-blue-600 via-cyan-600 to-blue-700',
          deckColor: 'bg-blue-700',
          borderAccent: 'border-cyan-400',
          title: 'KARTU NASIB WARGA WNI',
          subtitle: 'SURAT TAKDIR REPUBLIK',
          backLabel: 'NASIB WARGA 62',
          icon: <ShieldCheck className="w-6 h-6 text-yellow-300" />
        };
    }
  };

  const theme = getCategoryTheme();

  // Replay draw and 3D spin animation
  const handleReplaySpin = () => {
    soundManager.playCardDraw();
    setTimeout(() => {
      soundManager.playCardSpin();
    }, 150);
    setAnimKey((prev) => prev + 1);
  };

  // Toggle card flip (front / back)
  const handleToggleFlip = () => {
    soundManager.playCardSpin();
    setShowCardBack((prev) => !prev);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-3 sm:p-4 select-none">
      {/* Top Floating Draw Status Pill */}
      <div className="mb-3 px-4 py-1.5 rounded-full bg-slate-900/90 border-2 border-amber-400 shadow-xl flex items-center gap-2 text-white text-xs font-bold font-comic animate-bounce">
        <Layers className="w-4 h-4 text-yellow-400 animate-pulse" />
        <span>
          {isSpinning
            ? '🎴 Kartu ditarik dari tumpukan & berputar...'
            : '✨ Kartu telah terbuka! Simak nasibmu:'}
        </span>
      </div>

      {/* Main Perspective Wrapper */}
      <div className="relative max-w-md w-full flex flex-col items-center">
        {/* Underlying Deck Stack (Visual anchor showing card was drawn from deck) */}
        <div className="absolute -bottom-6 w-[88%] h-24 rounded-3xl bg-slate-800/60 border-3 border-slate-900 comic-box -z-10 animate-deck-stack opacity-60 flex items-end justify-center pb-2">
          <div className="text-[10px] font-mono text-slate-300 uppercase tracking-widest font-black flex items-center gap-1">
            <span>TUMPUKAN KARTU DECK</span>
          </div>
        </div>

        {/* 3D Animated Card Container */}
        <div
          key={`event-card-${animKey}`}
          className={`w-full rounded-3xl border-4 border-slate-900 comic-box-lg overflow-hidden shadow-2xl relative ${
            isSpinning ? 'animate-card-draw-spin' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {/* Sweeping holographic/foil reflection shine sheen */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-3xl">
            <div className="w-1/2 h-[200%] -top-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-card-shine" />
          </div>

          {!showCardBack ? (
            /* ================= FRONT OF CARD ================= */
            <div className="bg-[#fffdf7] flex flex-col">
              {/* Card Header */}
              <div
                className={`bg-gradient-to-r ${theme.gradientHeader} p-4 sm:p-5 text-white flex items-center justify-between border-b-3 border-slate-900 relative overflow-hidden`}
              >
                <div className="flex items-center gap-3 z-10">
                  <div className="p-2.5 bg-white/20 rounded-2xl border-2 border-white/40 shadow-inner">
                    {theme.icon}
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-black text-amber-200 block drop-shadow-sm">
                      {theme.title}
                    </span>
                    <h3 className="text-base sm:text-xl font-black font-comic leading-tight text-white drop-shadow-md">
                      {card.title}
                    </h3>
                  </div>
                </div>

                {/* Corner Quick 3D Flip Button */}
                <button
                  onClick={handleToggleFlip}
                  className="z-10 p-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/40 text-white transition-all cursor-pointer shadow-xs"
                  title="Lihat Punggung Kartu"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 space-y-3.5">
                {/* Description Quote Box */}
                <div className="bg-amber-100/70 p-4 rounded-2xl border-2 border-slate-900 comic-box-sm shadow-inner relative">
                  <span className="text-2xl text-amber-500 font-serif absolute top-1 left-2 select-none opacity-40">
                    “
                  </span>
                  <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-semibold italic pl-3 pr-1">
                    {card.description}
                  </p>
                </div>

                {/* Consequence Box */}
                <div className="p-3.5 bg-amber-50 rounded-2xl border-2 border-slate-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black font-comic text-slate-700 uppercase tracking-wide">
                      Akibat bagi {player.name}:
                    </p>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      ID: #{card.id}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-slate-950 font-comic">
                    {card.effectDescription}
                  </p>

                  {/* Impact Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {isPositiveMoney && (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-black text-xs rounded-xl border border-emerald-400 shadow-2xs font-mono">
                        +{formatRupiah(card.moneyChange)}
                      </span>
                    )}
                    {isNegativeMoney && (
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-900 font-black text-xs rounded-xl border border-rose-400 shadow-2xs font-mono">
                        {formatRupiah(card.moneyChange)}
                      </span>
                    )}
                    {card.karmaChange !== 0 && (
                      <span
                        className={`px-2.5 py-1 font-black text-xs rounded-xl border shadow-2xs font-comic ${
                          card.karmaChange > 0
                            ? 'bg-rose-100 text-rose-900 border-rose-400'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-400'
                        }`}
                      >
                        Karma: {card.karmaChange > 0 ? `+${card.karmaChange}%` : `${card.karmaChange}%`}
                      </span>
                    )}
                    {card.goToJail && (
                      <span className="px-2.5 py-1 bg-slate-950 text-yellow-300 font-black text-xs rounded-xl border border-yellow-400 shadow-2xs">
                        ⛓️ Dijebloskan ke Sukamiskin!
                      </span>
                    )}
                  </div>
                </div>

                {/* Interactive Controls (Spin again & Confirm button) */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleReplaySpin}
                    className="px-3.5 py-3 bg-amber-200 hover:bg-amber-300 active:scale-95 text-slate-900 font-bold rounded-2xl border-2 border-slate-900 comic-box-sm flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-all"
                    title="Putar Ulang Efek Ditarik & Berputar"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Putar Ulang</span>
                  </button>

                  <button
                    onClick={onConfirm}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 active:scale-98 text-white font-black font-comic text-xs sm:text-sm uppercase tracking-wider rounded-2xl border-3 border-slate-900 comic-box-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4 text-emerald-400 stroke-3" />
                    <span>Laksanakan & Lanjut</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================= BACK OF CARD (Stylized Monopoly Deck Back) ================= */
            <div
              className={`p-6 sm:p-8 bg-gradient-to-br ${theme.gradientHeader} text-white flex flex-col items-center justify-center text-center space-y-4 min-h-[360px] cursor-pointer`}
              onClick={handleToggleFlip}
            >
              <div className="w-full h-full border-4 border-dashed border-amber-300/80 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 bg-black/15 shadow-inner">
                <span className="text-4xl sm:text-5xl animate-bounce">🇮🇩</span>
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-amber-200 font-black">
                    KARTU RAHASIA WARGA 62
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-black font-comic tracking-wider text-white mt-1 drop-shadow-lg">
                    {theme.backLabel}
                  </h2>
                </div>

                <div className="w-16 h-1 bg-amber-400 rounded-full" />

                <p className="text-xs text-amber-100/90 font-medium italic max-w-xs leading-relaxed">
                  "Dari Gaji UMR, Pajak Progresif, Sampai OTT KPK: Semua Takdir Terangkum di Sini."
                </p>

                <div className="pt-2">
                  <span className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold border border-white/40 flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5" />
                    Klik untuk Membuka Kartu →
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
