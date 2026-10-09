import React, { useEffect, useState } from 'react';
import { SkillActivationInfo } from '../types/game';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Zap, Sparkles, X } from 'lucide-react';

interface SkillActivationOverlayProps {
  info: SkillActivationInfo | null;
  onDismiss: () => void;
}

export const SkillActivationOverlay: React.FC<SkillActivationOverlayProps> = ({
  info,
  onDismiss,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!info) return;

    // Trigger audio based on sound type
    if (info.soundType === 'fanfare') {
      soundManager.playFanfare();
    } else if (info.soundType === 'money') {
      soundManager.playMoney();
    } else if (info.soundType === 'siren') {
      soundManager.playSiren();
    } else if (info.soundType === 'boing') {
      soundManager.playBoing();
    } else {
      soundManager.playSkillPowerUp();
    }

    // Festive comic confetti burst
    try {
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.5 },
        colors: [info.playerColor || '#f59e0b', '#fbbf24', '#f43f5e', '#3b82f6', '#10b981'],
      });
    } catch {
      // Graceful fallback if confetti unavailable
    }

    // Auto dismiss timer (2.6s)
    const startTime = Date.now();
    const duration = 2600;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(timer);
        onDismiss();
      }
    }, 30);

    return () => clearInterval(timer);
  }, [info, onDismiss]);

  if (!info) return null;

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs select-none cursor-pointer animate-in fade-in duration-200 overflow-hidden"
    >
      {/* Comic Sunburst Rotating Action Rays */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
        <svg
          viewBox="0 0 500 500"
          className="w-[180vw] max-w-[1200px] h-[180vw] max-h-[1200px] animate-sunburst-spin"
        >
          <g fill="currentColor" className="text-yellow-400">
            {Array.from({ length: 16 }).map((_, i) => (
              <polygon
                key={i}
                points="250,250 220,0 280,0"
                transform={`rotate(${i * 22.5} 250 250)`}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Floating Sparkles & Comic Emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-8 text-2xl animate-sparkle-drift opacity-80">
          ⚡
        </div>
        <div className="absolute bottom-1/4 right-8 text-3xl animate-sparkle-drift opacity-80 [animation-delay:400ms]">
          ✨
        </div>
        <div className="absolute top-1/3 right-12 text-2xl animate-sparkle-drift opacity-80 [animation-delay:800ms]">
          💥
        </div>
        <div className="absolute bottom-1/3 left-12 text-3xl animate-sparkle-drift opacity-80 [animation-delay:1200ms]">
          {info.badgeEmoji || '🔥'}
        </div>
      </div>

      {/* Center Character Skill Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#fffdf7] border-4 border-slate-950 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl comic-box-lg animate-skill-card-pop overflow-hidden cursor-default"
      >
        {/* Dynamic Glow Banner Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 rounded-xl border-2 border-slate-900 shadow-xs font-comic font-black text-xs uppercase tracking-wider animate-comic-ribbon">
            <Zap className="w-3.5 h-3.5 text-amber-900 animate-bounce" />
            <span>KEAHLIAN KHUSUS DIAKTIFKAN!</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-900" />
          </div>

          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 flex items-center justify-center text-slate-700 cursor-pointer transition-transform active:scale-90"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Character Avatar & Aura */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative shrink-0">
            {/* Expanding Aura Ring */}
            <div
              className="absolute inset-0 rounded-full border-3 animate-aura-ring pointer-events-none"
              style={{ borderColor: info.playerColor }}
            />
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-3 border-slate-950 flex items-center justify-center text-3xl sm:text-4xl shadow-md comic-box-sm relative z-10"
              style={{ backgroundColor: info.playerColor }}
            >
              {info.playerAvatar}
              {/* Little corner badge */}
              <span className="absolute -bottom-1 -right-1 text-sm bg-white rounded-full border border-slate-900 px-1 shadow-2xs">
                {info.badgeEmoji || '⚡'}
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              {info.characterRole}
            </span>
            <h3 className="text-lg sm:text-xl font-black font-comic text-slate-950 truncate mt-0.5">
              {info.playerName}
            </h3>
            {info.bonusText && (
              <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-500 text-emerald-900 font-mono font-black text-xs shadow-2xs">
                <span>{info.bonusText}</span>
              </div>
            )}
          </div>
        </div>

        {/* Skill Details Showcase Box */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-br from-amber-50 to-orange-50/70 border-2 border-slate-900 rounded-2xl mb-3 space-y-1.5 shadow-inner">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">🏆</span>
            <h4 className="font-comic font-black text-sm sm:text-base text-amber-950 uppercase tracking-tight">
              {info.skillName}
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-snug">
            {info.skillEffect}
          </p>
        </div>

        {/* Flavor Character Quote Speech Bubble */}
        {info.quote && (
          <div className="relative bg-white p-2.5 px-3 rounded-xl border border-slate-300 text-xs text-slate-600 italic mb-4 shadow-2xs">
            <span className="font-bold text-slate-400 mr-1">“</span>
            {info.quote}
            <span className="font-bold text-slate-400 ml-1">”</span>
          </div>
        )}

        {/* Footer Actions & Timer Progress */}
        <div className="space-y-2">
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-400">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>Efek spesial sedang berlangsung</span>
            <button
              onClick={onDismiss}
              className="text-slate-700 font-bold hover:text-slate-950 underline cursor-pointer"
            >
              Ketuk untuk lanjut (Lolos)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
