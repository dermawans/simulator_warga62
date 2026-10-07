import React from 'react';
import { Player, BoardTile } from '../types/game';
import { formatRupiah } from '../utils/formatters';
import { Siren, HelpCircle, Building } from 'lucide-react';

interface PlayersOverviewBarProps {
  players: Player[];
  activePlayer: Player;
  tiles: BoardTile[];
  onOpenKarmaInfo: (player: Player) => void;
  myOnlinePlayerId?: string | null;
}

export const PlayersOverviewBar: React.FC<PlayersOverviewBarProps> = ({
  players,
  activePlayer,
  tiles,
  onOpenKarmaInfo,
  myOnlinePlayerId
}) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {players.map((p) => {
          const isActive = p.id === activePlayer.id;
          const isMe = !!(myOnlinePlayerId && p.id === myOnlinePlayerId);
          const isHighKarma = p.karma >= 60;
          const ownedPropsCount = tiles.filter((t) => t.ownerId === p.id).length;

          return (
            <div
              key={p.id}
              className={`p-3.5 rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'bg-amber-100 border-slate-900 shadow-md ring-2 ring-amber-400'
                  : isMe
                  ? 'bg-blue-50/90 border-blue-400 shadow-xs ring-1 ring-blue-300'
                  : 'bg-white/95 border-slate-300 shadow-xs'
              } ${p.isBankrupt ? 'opacity-40 grayscale' : ''}`}
            >
              {/* Active ribbon */}
              {isActive && (
                <div className="absolute top-0 right-0 bg-slate-900 text-yellow-300 text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg font-comic uppercase tracking-wider shadow-xs">
                  {isMe ? 'Giliran Anda!' : 'Giliran'}
                </div>
              )}

              {/* Player Header: Avatar + Full Name & Accessory (NO CUT-OFF) */}
              <div className="flex items-center gap-2.5 mb-2.5 pr-8">
                <div
                  className="w-10 h-10 rounded-full border-2 border-slate-900 flex items-center justify-center text-xl shrink-0 shadow-xs"
                  style={{ backgroundColor: p.color }}
                >
                  {p.avatarEmoji}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 font-comic leading-tight">
                      {p.name}
                    </p>
                    {isMe && (
                      <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-mono font-bold">
                        ANDA
                      </span>
                    )}
                    {p.isBot && (
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono">
                        Bot
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                    {p.accessory}
                  </p>
                </div>
              </div>

              {/* Stats: Cash Balance & Owned Properties */}
              <div className="space-y-1 bg-amber-50/60 p-2 rounded-xl border border-amber-200/60 text-xs mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Saldo Kas:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatRupiah(p.money)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-400" /> Aset Properti:
                  </span>
                  <span className="font-semibold text-slate-700">
                    {ownedPropsCount} Kavling
                  </span>
                </div>
              </div>

              {/* Karma & KPK Risk Bar with Clickable Info Tooltip */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <button
                    onClick={() => onOpenKarmaInfo(p)}
                    className="flex items-center gap-1 text-slate-700 hover:text-red-600 transition-colors cursor-pointer group"
                    title="Klik untuk melihat dari mana Karma berasal dan cara menghapusnya"
                  >
                    {isHighKarma ? (
                      <Siren className="w-3.5 h-3.5 text-red-600 animate-bounce" />
                    ) : (
                      <span className="text-xs">⚖️</span>
                    )}
                    <span className="group-hover:underline">Risiko OTT KPK:</span>
                    <HelpCircle className="w-3 h-3 text-slate-400 group-hover:text-red-600" />
                  </button>
                  <span
                    onClick={() => onOpenKarmaInfo(p)}
                    className={`font-mono cursor-pointer ${
                      isHighKarma ? 'text-red-600 font-bold' : 'text-slate-800'
                    }`}
                  >
                    {p.karma}%
                  </span>
                </div>

                <div
                  onClick={() => onOpenKarmaInfo(p)}
                  className="w-full h-2 bg-slate-200 rounded-full overflow-hidden cursor-pointer hover:opacity-90"
                  title="Klik untuk membuka Buku Panduan Karma"
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      p.karma > 70
                        ? 'bg-red-600'
                        : p.karma > 40
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, p.karma)}%` }}
                  />
                </div>
              </div>

              {/* Jail Status */}
              {p.inJail && (
                <div className="mt-2 py-1 px-2 bg-slate-900 text-yellow-300 rounded-lg text-[10px] font-bold text-center">
                  ⛓️ Ditahan di Lapas Sukamiskin ({p.jailTurns} giliran tersisa)
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
