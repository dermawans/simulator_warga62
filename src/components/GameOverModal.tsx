import React from 'react';
import { Player, BoardTile } from '../types/game';
import { formatRupiah } from '../utils/formatters';
import { Trophy, RotateCcw, Share2, Medal, Building2, Crown, Skull } from 'lucide-react';

interface GameOverModalProps {
  winner: Player;
  players: Player[];
  tiles: BoardTile[];
  reason: 'ELIMINATION' | 'TARGET_REACHED' | 'ROUNDS_COMPLETED';
  totalRounds: number;
  onRestart: () => void;
  onOpenLeaderboard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  players,
  tiles,
  reason,
  totalRounds,
  onRestart,
  onOpenLeaderboard
}) => {
  // Calculate net worth for all players
  const calculateNetWorth = (p: Player) => {
    let total = p.money;
    tiles.forEach((t) => {
      if (t.ownerId === p.id) {
        total += t.price + t.houses * t.housePrice;
      }
    });
    return total;
  };

  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isBankrupt && !b.isBankrupt) return 1;
    if (!a.isBankrupt && b.isBankrupt) return -1;
    return calculateNetWorth(b) - calculateNetWorth(a);
  });

  const getReasonTitle = () => {
    switch (reason) {
      case 'TARGET_REACHED':
        return 'REKOR SULTAN KONGSI TERCAPAI (NET WORTH > RP 80 JUTA)!';
      case 'ROUNDS_COMPLETED':
        return `BATAS WAKTU ${totalRounds} PUTARAN SELESAI!`;
      case 'ELIMINATION':
      default:
        return 'MONOPOLI TOTAL: SELURUH LAWAN BANGKRUT!';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-amber-50 rounded-3xl comic-box-lg max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 p-5 text-slate-950 text-center border-b-4 border-slate-900 relative">
          <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-900 mx-auto flex items-center justify-center text-4xl shadow-md mb-2">
            🏆
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-slate-950 text-yellow-300 px-3 py-1 rounded-full">
            PERMAINAN SELESAI
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-comic uppercase tracking-tight mt-1">
            PENOBATAN SULTAN WARGA62
          </h2>
          <p className="text-xs font-bold text-slate-800 uppercase mt-0.5">
            {getReasonTitle()}
          </p>
        </div>

        {/* Winner Highlight Card */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="bg-gradient-to-br from-amber-100 to-yellow-200 p-4 rounded-2xl border-2 border-slate-900 flex items-center gap-4 shadow-sm">
            <div
              className="w-16 h-16 rounded-full border-2 border-slate-900 flex items-center justify-center text-3xl shadow-sm shrink-0"
              style={{ backgroundColor: winner.color }}
            >
              {winner.avatarEmoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-700 fill-current" />
                <h3 className="text-lg font-black font-comic text-slate-950 truncate">
                  {winner.name}
                </h3>
              </div>
              <p className="text-xs text-rose-700 font-bold">{winner.accessory}</p>
              <p className="text-xs text-slate-700 italic mt-0.5">"{winner.quote}"</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs font-mono font-bold">
                <span className="text-emerald-800">
                  Kekayaan Bersih: {formatRupiah(calculateNetWorth(winner))}
                </span>
              </div>
            </div>
          </div>

          {/* Leaderboard Podium Table */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Medal className="w-4 h-4 text-amber-600" /> Peringkat Akhir Warga Nusantara:
            </p>

            <div className="space-y-1.5">
              {sortedPlayers.map((p, idx) => {
                const netWorth = calculateNetWorth(p);
                const propsCount = tiles.filter((t) => t.ownerId === p.id).length;

                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      idx === 0
                        ? 'bg-amber-100 border-amber-400 font-bold text-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700'
                    } ${p.isBankrupt ? 'opacity-50 grayscale' : ''}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-comic font-black text-xs shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xl">{p.avatarEmoji}</span>
                      <div className="truncate">
                        <p className="font-bold text-slate-900 truncate">
                          {p.name} {idx === 0 ? '👑' : ''}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Building2 className="w-2.5 h-2.5" /> {propsCount} Kavling
                          {p.isBankrupt && <span className="text-rose-600 font-bold">(Pailit)</span>}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-slate-900">
                        {formatRupiah(netWorth)}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Kas: {formatRupiah(p.money)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-amber-100/80 border-t-2 border-slate-900 flex flex-wrap gap-2.5 justify-between">
          <button
            onClick={onOpenLeaderboard}
            className="py-2.5 px-4 bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 text-xs font-bold rounded-xl comic-box-sm cursor-pointer flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            Papan Peringkat Global
          </button>

          <button
            onClick={onRestart}
            className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-yellow-300 text-xs font-black uppercase tracking-wider rounded-xl comic-box-sm comic-btn-hover cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Main Lagi (Rematch)
          </button>
        </div>
      </div>
    </div>
  );
};
