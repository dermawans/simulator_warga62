import React from 'react';
import { Volume2, VolumeX, Trophy, BookOpen, RotateCcw, Cloud, Globe, MessageSquarePlus } from 'lucide-react';

interface TopBarProps {
  isMuted: boolean;
  onToggleAudio: () => void;
  onOpenLeaderboard: () => void;
  onOpenRules: () => void;
  onOpenSaveLoad: () => void;
  onOpenMultiplayer?: () => void;
  onOpenFeedback?: () => void;
  multiplayerRoomCode?: string | null;
  onResetGame: () => void;
  inGame: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  isMuted,
  onToggleAudio,
  onOpenLeaderboard,
  onOpenRules,
  onOpenSaveLoad,
  onOpenMultiplayer,
  onOpenFeedback,
  multiplayerRoomCode,
  onResetGame,
  inGame
}) => {
  return (
    <header className="w-full max-w-full overflow-hidden bg-amber-400 border-b-4 border-slate-900 px-2 sm:px-6 py-2 sm:py-3 flex items-center justify-between shadow-md select-none sticky top-0 z-40 gap-1 sm:gap-2">
      {/* Zone 1: Brand title */}
      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
        <span className="text-lg sm:text-2xl shrink-0">🇮🇩</span>
        <span className="text-xs sm:text-xl font-black font-comic tracking-tight text-slate-950 uppercase truncate">
          Simulator Warga62
        </span>
        {multiplayerRoomCode && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 rounded-full bg-blue-600 text-yellow-300 font-mono font-bold text-[10px] sm:text-xs border border-slate-900 shadow-xs shrink-0">
            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin-slow shrink-0" />
            <span className="truncate max-w-[55px] sm:max-w-none">{multiplayerRoomCode}</span>
          </span>
        )}
      </div>

      {/* Zone 2: Navigation actions (Desktop) */}
      <nav className="hidden md:flex items-center gap-3 lg:gap-4 text-xs sm:text-sm font-bold text-slate-900 font-comic">
        {onOpenMultiplayer && !multiplayerRoomCode && (
          <button
            onClick={onOpenMultiplayer}
            className="flex items-center gap-1.5 text-white transition-all whitespace-nowrap cursor-pointer px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl border-2 border-slate-900 shadow-sm font-comic hover:scale-105"
          >
            <Globe className="w-4 h-4 text-yellow-300 animate-spin-slow" />
            <span>Mabar Online (Lobby)</span>
            <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.2 rounded font-black uppercase">
              Hot
            </span>
          </button>
        )}
        <button
          onClick={onOpenSaveLoad}
          className="flex items-center gap-1.5 text-emerald-900 hover:text-emerald-950 transition-colors whitespace-nowrap cursor-pointer px-2.5 py-1 bg-emerald-300/60 rounded-xl border border-slate-900"
        >
          <Cloud className="w-4 h-4 text-emerald-800" />
          Simpan / Lanjut (Cloud)
        </button>
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
        {onOpenFeedback && (
          <button
            onClick={onOpenFeedback}
            className="flex items-center gap-1.5 text-slate-800 hover:text-slate-950 transition-colors whitespace-nowrap cursor-pointer px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 rounded-xl border border-slate-900/60 shadow-2xs"
            title="Lapor Bug & Kotak Saran Warga"
          >
            <MessageSquarePlus className="w-4 h-4 text-rose-600" />
            <span>Lapor / Saran</span>
          </button>
        )}
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

      {/* Zone 3: Primary actions & Audio toggle (Mobile & Desktop Responsive) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {onOpenMultiplayer && !multiplayerRoomCode && (
          <button
            onClick={onOpenMultiplayer}
            className="md:hidden px-2 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 border border-slate-900 text-white font-bold font-comic text-[10px] flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
            title="Mabar Online (Lobby)"
          >
            <Globe className="w-3 h-3 text-yellow-300 animate-spin-slow" />
            <span>Mabar</span>
          </button>
        )}

        {onOpenFeedback && (
          <button
            onClick={onOpenFeedback}
            className="md:hidden w-7 h-7 rounded-lg bg-amber-200 border border-slate-900 text-slate-900 cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
            title="Lapor Bug & Usulan Fitur"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-rose-600" />
          </button>
        )}

        <button
          onClick={onOpenSaveLoad}
          className="md:hidden w-7 h-7 rounded-lg bg-emerald-300 border border-slate-900 text-slate-950 cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
          title="Simpan / Lanjut Game (Cloud Save)"
        >
          <Cloud className="w-3.5 h-3.5 text-emerald-900" />
        </button>

        <button
          onClick={onOpenLeaderboard}
          className="md:hidden w-7 h-7 rounded-lg bg-amber-200 border border-slate-900 text-slate-900 cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
          title="Papan Peringkat"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-900" />
        </button>

        <button
          onClick={onToggleAudio}
          className={`h-7 sm:h-auto py-1 px-1.5 sm:py-2 sm:px-3.5 rounded-lg sm:rounded-xl border border-slate-900 sm:border-2 text-[10px] sm:text-xs font-black font-comic flex items-center gap-1 transition-all shadow-2xs cursor-pointer shrink-0 ${
            isMuted
              ? 'bg-slate-200 text-slate-600'
              : 'bg-white text-slate-950 hover:bg-slate-50'
          }`}
          title={isMuted ? 'Nyalakan Musik & Efek' : 'Bisukan Suara'}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 animate-pulse" />
          )}
          <span className="hidden sm:inline">{isMuted ? 'Musik: Mati' : 'Musik: Nyala'}</span>
        </button>
      </div>
    </header>
  );
};
