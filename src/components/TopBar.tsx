import React from 'react';
import { Volume2, VolumeX, Trophy, BookOpen, RotateCcw } from 'lucide-react';

interface TopBarProps {
  isMuted: boolean;
  onToggleAudio: () => void;
  onOpenLeaderboard: () => void;
  onOpenRules: () => void;
  onResetGame: () => void;
  inGame: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  isMuted,
  onToggleAudio,
  onOpenLeaderboard,
  onOpenRules,
  onResetGame,
  inGame
}) => {
  return (
    <header className="w-full bg-amber-400 border-b-4 border-slate-900 px-4 sm:px-6 py-3 flex items-center justify-between shadow-md select-none sticky top-0 z-40">
      {/* Zone 1: Brand title, single line */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">🇮🇩</span>
        <span className="text-lg sm:text-xl font-black font-comic tracking-tight text-slate-950 uppercase whitespace-nowrap">
          Simulator WNI
        </span>
      </div>

      {/* Zone 2: Navigation actions */}
      <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-bold text-slate-900 font-comic">
        <button
          onClick={onOpenLeaderboard}
          className="flex items-center gap-1.5 hover:text-red-700 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Trophy className="w-4 h-4 text-amber-900" />
          Papan Peringkat
        </button>
        <button
          onClick={onOpenRules}
          className="flex items-center gap-1.5 hover:text-red-700 transition-colors whitespace-nowrap cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          Tata Tertib
        </button>
        {inGame && (
          <button
            onClick={onResetGame}
            className="flex items-center gap-1.5 text-rose-800 hover:text-rose-950 transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Mulai Baru
          </button>
        )}
      </nav>

      {/* Zone 3: Primary actions & Audio toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenLeaderboard}
          className="md:hidden p-2 rounded-xl bg-amber-200 border-2 border-slate-900 text-slate-900 cursor-pointer"
          title="Papan Peringkat"
        >
          <Trophy className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleAudio}
          className={`py-2 px-3.5 rounded-xl border-2 border-slate-900 text-xs font-black font-comic flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
            isMuted
              ? 'bg-slate-200 text-slate-600'
              : 'bg-white text-slate-950 hover:bg-slate-50'
          }`}
          title={isMuted ? 'Nyalakan Musik & Efek' : 'Bisukan Suara'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />}
          <span className="hidden sm:inline">{isMuted ? 'Musik: Mati' : 'Musik: Nyala'}</span>
        </button>
      </div>
    </header>
  );
};
