import React from 'react';
import { BoardTile, Player, EconomicCondition } from '../types/game';
import { formatRupiah } from '../utils/formatters';
import { UPGRADE_TIERS } from '../data/boardTiles';
import { X, Building2, User, Coins } from 'lucide-react';

interface TileDetailModalProps {
  tile: BoardTile | null;
  players: Player[];
  economic: EconomicCondition;
  onClose: () => void;
  onUpgrade?: (tileId: number) => void;
  onSellProperty?: (tileId: number) => void;
  activePlayer: Player;
  isOnlineMode?: boolean;
  isMyTurnOnline?: boolean;
  myOnlinePlayerId?: string | null;
}

export const TileDetailModal: React.FC<TileDetailModalProps> = ({
  tile,
  players,
  economic,
  onClose,
  onUpgrade,
  onSellProperty,
  activePlayer,
  isOnlineMode = false,
  isMyTurnOnline = true,
  myOnlinePlayerId = null
}) => {
  if (!tile) return null;

  const owner = players.find((p) => p.id === tile.ownerId);
  const isOwner = isOnlineMode
    ? !!(myOnlinePlayerId && owner?.id === myOnlinePlayerId)
    : owner?.id === activePlayer.id;
  const canManage = isOwner && (!isOnlineMode || isMyTurnOnline);
  const effectiveUpgradePrice = activePlayer.characterId === 'driver_ojol'
    ? Math.round(tile.housePrice * 0.75)
    : tile.housePrice;
  const canUpgrade = canManage && tile.type === 'property' && tile.houses < 3 && activePlayer.money >= effectiveUpgradePrice;
  const canSell = canManage && (tile.type === 'property' || tile.type === 'bumn') && onSellProperty;
  const sellValue = Math.round(tile.price * 0.75);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-amber-50 rounded-2xl comic-box-lg max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div 
          className="p-4 text-white flex items-center justify-between"
          style={{ backgroundColor: tile.colorTag || '#475569' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1 bg-white/20 rounded-xl">{tile.icon}</span>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold opacity-90">{tile.city || 'Fasilitas Umum'}</p>
              <h3 className="text-xl font-bold font-comic leading-tight">{tile.name}</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-700 italic bg-amber-100/70 p-3 rounded-xl border border-amber-300">
            "{tile.description}"
          </p>

          {tile.type === 'property' || tile.type === 'bumn' ? (
            <>
              {/* Ownership */}
              <div className="flex items-center justify-between p-3 bg-white rounded-xl comic-box-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold">Pemilik:</span>
                </div>
                <div className="flex items-center gap-2">
                  {owner ? (
                    <>
                      <span>{owner.avatarEmoji}</span>
                      <span className="font-bold text-sm" style={{ color: owner.color }}>{owner.name}</span>
                    </>
                  ) : (
                    <span className="text-sm text-slate-400 font-medium">Belum ada (Kavling Bebas)</span>
                  )}
                </div>
              </div>

              {/* Price & Current Rent */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-white rounded-xl comic-box-sm">
                  <p className="text-xs text-slate-500 font-medium">Harga Kavling</p>
                  <p className="text-base font-bold text-slate-900 font-comic mt-0.5">
                    {formatRupiah(tile.price)}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl comic-box-sm">
                  <p className="text-xs text-slate-500 font-medium">Sewa Saat Ini</p>
                  <p className="text-base font-bold text-rose-600 font-comic mt-0.5">
                    {formatRupiah(
                      Math.round(tile.baseRent * UPGRADE_TIERS[tile.houses].multiplier * economic.rentMultiplier)
                    )}
                  </p>
                </div>
              </div>

              {/* Rent breakdown by tier */}
              {tile.type === 'property' && (
                <div className="bg-white p-3 rounded-xl comic-box-sm space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Tarif Sewa Berdasarkan Tingkat Usaha
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {UPGRADE_TIERS.map((tier) => {
                      const isCurrent = tile.houses === tier.level;
                      const calculatedRent = Math.round(tile.baseRent * tier.multiplier * economic.rentMultiplier);
                      return (
                        <div 
                          key={tier.level}
                          className={`flex items-center justify-between p-1.5 rounded-lg ${
                            isCurrent ? 'bg-amber-100 font-bold border border-amber-400 text-slate-900' : 'text-slate-600'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>{tier.icon}</span>
                            <span>{tier.label} {isCurrent && '(Aktif)'}</span>
                          </span>
                          <span className="font-mono">{formatRupiah(calculatedRent)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex justify-between">
                    <span>Biaya Renovasi Tiap Tingkat:</span>
                    <span className="font-semibold text-slate-800">{formatRupiah(tile.housePrice)}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-white rounded-xl comic-box-sm text-center">
              <p className="text-sm font-medium text-slate-700">
                Petak Khusus Event & Penegakan Hukum RI. Berlaku ketentuan khusus saat berhenti di sini.
              </p>
            </div>
          )}

          {/* Action button */}
          <div className="pt-2 flex flex-col gap-2">
            {canUpgrade && onUpgrade && (
              <button
                onClick={() => {
                  onUpgrade(tile.id);
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl comic-box-sm comic-btn-hover flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Coins className="w-4 h-4" />
                Upgrade ke {UPGRADE_TIERS[tile.houses + 1].label} ({formatRupiah(effectiveUpgradePrice)})
                {activePlayer.characterId === 'driver_ojol' && ' (Diskon Ojol 25%)'}
              </button>
            )}

            {canSell && onSellProperty && (
              <button
                onClick={() => {
                  onSellProperty(tile.id);
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl comic-box-sm comic-btn-hover flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Coins className="w-4 h-4" />
                Gadaikan / Jual Kavling ke Bank (+{formatRupiah(sellValue)})
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl comic-box-sm comic-btn-hover cursor-pointer text-xs"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
