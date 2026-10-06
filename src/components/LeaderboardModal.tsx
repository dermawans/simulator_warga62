import React, { useState } from 'react';
import { LeaderboardRecord } from '../types/game';
import { formatRupiah } from '../utils/formatters';
import { X, Trophy, Skull, HeartHandshake, Medal } from 'lucide-react';

interface LeaderboardModalProps {
  records: LeaderboardRecord[];
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  records,
  onClose
}) => {
  const [filter, setFilter] = useState<'ALL' | 'SULTAN' | 'KORUPTOR' | 'BERKAH'>('ALL');

  const filteredRecords = records.filter((r) => {
    if (filter === 'ALL') return true;
    return r.category === filter;
  }).sort((a, b) => {
    if (filter === 'KORUPTOR') return b.totalBribes - a.totalBribes;
    return b.netWorth - a.netWorth;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-amber-50 rounded-2xl comic-box-lg max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 p-4 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/40 rounded-xl text-2xl">🏆</span>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-amber-950">Papan Peringkat Warga</p>
              <h3 className="text-xl font-bold font-comic">Hall of Fame WNI Nusantara</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-black/10 hover:bg-black/20 text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-amber-200 bg-amber-100/60 p-2 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={`py-1.5 px-3 text-xs font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              filter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-amber-200'
            }`}
          >
            Semua Warga
          </button>
          <button
            onClick={() => setFilter('SULTAN')}
            className={`py-1.5 px-3 text-xs font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
              filter === 'SULTAN' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-700 hover:bg-amber-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-slate-900" />
            Sultan Terkaya
          </button>
          <button
            onClick={() => setFilter('KORUPTOR')}
            className={`py-1.5 px-3 text-xs font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
              filter === 'KORUPTOR' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-700 hover:bg-amber-200'
            }`}
          >
            <Skull className="w-3.5 h-3.5" />
            Koruptor Paling Licin
          </button>
          <button
            onClick={() => setFilter('BERKAH')}
            className={`py-1.5 px-3 text-xs font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
              filter === 'BERKAH' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-700 hover:bg-amber-200'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            Warga Berkah & Halal
          </button>
        </div>

        {/* List */}
        <div className="p-4 space-y-2.5 max-h-[55vh] overflow-y-auto">
          {filteredRecords.map((item, index) => {
            return (
              <div
                key={item.id}
                className="p-3 bg-white rounded-xl comic-box-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    index === 0 ? 'bg-amber-400 text-slate-950 font-comic text-sm' :
                    index === 1 ? 'bg-slate-300 text-slate-800' :
                    index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-2xl">{item.characterEmoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 font-comic">{item.name}</p>
                      <span className="text-[10px] text-slate-500 font-medium">({item.role})</span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic line-clamp-1">"{item.statusNote}"</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-bold font-mono text-slate-900">
                    {formatRupiah(item.netWorth)}
                  </p>
                  {item.totalBribes > 0 && (
                    <p className="text-[10px] font-semibold text-rose-600">
                      Suap: {formatRupiah(item.totalBribes)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-amber-100/70 border-t border-amber-300 flex justify-between items-center text-xs text-slate-600 px-5">
          <span>Skor tersimpan otomatis setiap game selesai!</span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
