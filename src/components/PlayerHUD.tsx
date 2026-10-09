import React from 'react';
import { Player, BoardTile } from '../types/game';
import { formatRupiah } from '../utils/formatters';
import { Dices, Briefcase, Zap, CheckCircle2, Siren, KeyRound, Building, HelpCircle, MapPin } from 'lucide-react';

interface PlayerHUDProps {
  players: Player[];
  activePlayer: Player;
  tiles: BoardTile[];
  currentTile: BoardTile;
  canRoll: boolean;
  canEndTurn: boolean;
  canBuyProperty: boolean;
  canUpgradeProperty: boolean;
  onRollDice: () => void;
  onEndTurn: () => void;
  onBuyProperty: () => void;
  onOpenCorruption: () => void;
  onOpenSabotage: () => void;
  onPayBail: () => void;
  onOpenTileDetail: () => void;
  onOpenTileClick: (tile: BoardTile) => void;
  onOpenKarmaInfo: (player: Player) => void;
  isRolling: boolean;
  isHopping?: boolean;
  diceRoll?: [number, number];
  isOnlineMode?: boolean;
  isMyTurnOnline?: boolean;
  myOnlinePlayer?: Player | null;
  isDoubleRoll?: boolean;
  turnTimeLeft?: number;
}

export const PlayerHUD: React.FC<PlayerHUDProps> = ({
  players,
  activePlayer,
  tiles,
  currentTile,
  canRoll,
  canEndTurn,
  canBuyProperty,
  onRollDice,
  onEndTurn,
  onBuyProperty,
  onOpenCorruption,
  onOpenSabotage,
  onPayBail,
  onOpenTileDetail,
  onOpenTileClick,
  onOpenKarmaInfo,
  isRolling,
  isHopping = false,
  diceRoll,
  isOnlineMode = false,
  isMyTurnOnline = true,
  myOnlinePlayer = null,
  isDoubleRoll = false,
  turnTimeLeft = 60,
}) => {
  const isHighKarma = activePlayer.karma >= 60;
  const isMyTurn = !isOnlineMode || isMyTurnOnline;

  return (
    <div className="w-full space-y-4">
      {/* Active Citizen Spotlight Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl comic-box space-y-3.5 relative overflow-hidden">
        {/* Active Player Profile Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full border-2 border-slate-900 flex items-center justify-center text-2xl shrink-0 shadow-sm"
              style={{ backgroundColor: activePlayer.color }}
            >
              {activePlayer.avatarEmoji}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] bg-slate-900 text-yellow-300 font-bold px-2 py-0.5 rounded font-comic uppercase tracking-wider">
                  Giliran Aktif
                </span>
                {isOnlineMode && (
                  isMyTurnOnline ? (
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded font-mono shadow-xs">
                      ANDA
                    </span>
                  ) : (
                    <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded font-mono shadow-xs">
                      TEMAN
                    </span>
                  )
                )}
                {activePlayer.isBot && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                    AI Bot
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold font-comic text-slate-900 mt-0.5 leading-tight">
                {activePlayer.name}
              </h3>
              <p className="text-xs text-rose-600 font-semibold leading-tight mt-0.5">
                {activePlayer.accessory}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[11px] text-slate-500 font-medium">Kas Tunai:</p>
            <p className="text-base font-black font-mono text-slate-950">
              {formatRupiah(activePlayer.money)}
            </p>
          </div>
        </div>

        {/* Quote */}
        <p className="text-xs text-slate-600 italic bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/70">
          "{activePlayer.quote}"
        </p>

        {/* Current Location Petak */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Lokasi Saat Ini:
              </p>
              <p className="text-xs font-bold text-slate-900 font-comic truncate">
                {currentTile.icon} {currentTile.name}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenTileDetail}
            className="py-1 px-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-bold rounded-lg shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <Building className="w-3 h-3 text-slate-600" />
            Sertifikat
          </button>
        </div>

        {/* Karma KPK Bar & Info Button */}
        <div className="p-3 bg-red-50/70 rounded-xl border border-red-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              {isHighKarma ? (
                <Siren className="w-4 h-4 text-red-600 animate-bounce" />
              ) : (
                <span>⚖️</span>
              )}
              <span>Risiko Buronan KPK:</span>
            </div>
            <span className={`font-mono font-black text-sm ${isHighKarma ? 'text-red-600' : 'text-slate-800'}`}>
              {activePlayer.karma}%
            </span>
          </div>

          <div
            onClick={() => onOpenKarmaInfo(activePlayer)}
            className="w-full h-2 bg-slate-200 rounded-full overflow-hidden cursor-pointer"
            title="Klik untuk membuka info asal usul Karma"
          >
            <div
              className={`h-full transition-all duration-300 ${
                activePlayer.karma > 70
                  ? 'bg-red-600'
                  : activePlayer.karma > 40
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, activePlayer.karma)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <span className="text-slate-500">
              {activePlayer.karma >= 70
                ? '🚨 Status: Buronan DPO KPK!'
                : activePlayer.karma >= 40
                ? '⚠️ Status: Pantauan Intelejen'
                : '✅ Status: Warga Alim & Bersih'}
            </span>
            <button
              onClick={() => onOpenKarmaInfo(activePlayer)}
              className="font-bold text-red-700 hover:text-red-900 underline flex items-center gap-0.5 cursor-pointer"
            >
              <HelpCircle className="w-3 h-3" />
              Apa itu Karma?
            </button>
          </div>
        </div>

        {/* Owned Properties Quick Summary */}
        {tiles.filter((t) => t.ownerId === activePlayer.id).length > 0 && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-700" />
                Aset Properti Anda ({tiles.filter((t) => t.ownerId === activePlayer.id).length} Kavling)
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">Klik untuk kelola / jual</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tiles
                .filter((t) => t.ownerId === activePlayer.id)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onOpenTileClick(t)}
                    className="px-2 py-0.5 bg-white hover:bg-emerald-100 border border-emerald-400 rounded-md text-[11px] font-bold text-slate-800 transition-colors cursor-pointer shadow-2xs"
                    title="Klik untuk lihat sertifikat, upgrade, atau jual ke bank"
                  >
                    {t.name} {t.houses > 0 ? `(Lv.${t.houses})` : ''}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* In Jail notice & Dedicated Controls (Never gets stuck!) */}
        {activePlayer.inJail ? (
          <div className="p-3.5 bg-slate-900 border-2 border-amber-400 text-yellow-300 rounded-2xl space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-comic font-black text-xs sm:text-sm text-yellow-300 flex items-center gap-1.5">
                🏛️ Lapas Khusus Sukamiskin
              </span>
              <span className="px-2.5 py-0.5 bg-rose-600 text-white text-[11px] font-bold rounded-full font-mono">
                {activePlayer.jailTurns} Giliran Tersisa
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-snug">
              {isOnlineMode && !isMyTurnOnline
                ? `${activePlayer.name} mendekam di Lapas Sukamiskin. Menunggu ${activePlayer.name} menjalani hukuman atau menyuap sipir...`
                : 'Anda mendekam di Lapas Sukamiskin. Anda dapat menjalani masa hukuman giliran demi giliran atau menyuap sipir untuk bebas langsung.'}
            </p>

            <div className="space-y-2 pt-1">
              {/* Primary: Jalani Hukuman */}
              <button
                onClick={onEndTurn}
                disabled={activePlayer.isBot || !isMyTurn}
                className={`w-full py-3 px-3 rounded-xl comic-box-sm comic-btn-hover flex items-center justify-center gap-2 font-black font-comic text-xs uppercase tracking-wider ${
                  !activePlayer.isBot && isMyTurn
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 cursor-pointer shadow-sm'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                {!isMyTurn ? `Menunggu ${activePlayer.name} Jalani Hukuman` : 'Jalani Hukuman (-1 Giliran & Lanjut)'}
              </button>

              {/* Secondary: Suap Sipir */}
              {(() => {
                const bailCost = activePlayer.characterId === 'pengacara_sultan' ? 1250000 : 2500000;
                const canAffordBail = activePlayer.money >= bailCost;
                return (
                  <button
                    onClick={onPayBail}
                    disabled={!canAffordBail || activePlayer.isBot || !isMyTurn}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs comic-box-sm comic-btn-hover flex items-center justify-center gap-1.5 ${
                      canAffordBail && !activePlayer.isBot && isMyTurn
                        ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <KeyRound className="w-4 h-4" />
                    {canAffordBail
                      ? (activePlayer.characterId === 'pengacara_sultan'
                          ? `⚖️ Suap Sipir Hotmam (${formatRupiah(bailCost)})`
                          : `Suap Sipir Bebas Instan (${formatRupiah(bailCost)})`)
                      : `Suap Sipir (Perlu ${formatRupiah(bailCost)} - Saldo Kurang)`}
                  </button>
                );
              })()}
            </div>
          </div>
        ) : (
          /* Normal Action Controls Grid */
          <div className="space-y-2.5 pt-1">
            {isOnlineMode && !isMyTurnOnline && (
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-xl space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-blue-950 font-black text-xs uppercase tracking-wider font-comic">
                  <span className="text-base animate-spin">⏳</span>
                  <span>Giliran Teman: {activePlayer.name} ({activePlayer.avatarEmoji})</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-snug">
                  Sedang giliran <b>{activePlayer.name}</b>. Seluruh tombol aksi Anda dikunci sampai giliran Anda tiba.
                </p>
                {myOnlinePlayer && (
                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-600 border-t border-blue-200">
                    <span className="font-medium">Akun Anda:</span>
                    <span className="font-bold flex items-center gap-1 text-slate-900">
                      <span>{myOnlinePlayer.avatarEmoji}</span>
                      <span>{myOnlinePlayer.name}</span>
                      <span className="bg-blue-600 text-white px-1.5 py-0.2 rounded font-mono font-bold text-[9px]">ONLINE</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {isOnlineMode && isMyTurnOnline && (
              <div className="p-2.5 bg-gradient-to-r from-emerald-100 via-teal-50 to-emerald-100 border-2 border-emerald-500 rounded-xl flex items-center justify-between text-emerald-950 font-black text-xs font-comic shadow-xs animate-pulse">
                <div className="flex items-center gap-1.5">
                  <span className="text-base animate-bounce">🎲</span>
                  <span>GILIRAN ANDA SEKARANG!</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] rounded-full font-bold">
                  AKSI AKTIF
                </span>
              </div>
            )}

            {/* 60s Turn Timeout Countdown Display */}
            {turnTimeLeft !== undefined && (
              <div
                className={`p-2 px-3 rounded-xl border-2 flex items-center justify-between text-xs font-comic font-bold shadow-2xs transition-colors ${
                  turnTimeLeft <= 15
                    ? 'bg-rose-100 border-rose-500 text-rose-950 animate-pulse'
                    : turnTimeLeft <= 30
                    ? 'bg-amber-100 border-amber-400 text-amber-950'
                    : 'bg-slate-100 border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">⏱️</span>
                  <span>Waktu Giliran {isMyTurn ? '(Anda)' : `(${activePlayer.name.split(' ')[0]})`}:</span>
                </div>
                <span className={`font-mono font-black text-sm ${turnTimeLeft <= 15 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {turnTimeLeft}s
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onRollDice()}
                disabled={!canRoll || isRolling || activePlayer.isBot || !isMyTurn}
                className={`py-3 px-3 rounded-xl font-black text-xs uppercase tracking-wider comic-box-sm comic-btn-hover flex items-center justify-center gap-1.5 ${
                  canRoll && !isRolling && !activePlayer.isBot && isMyTurn
                    ? isDoubleRoll
                      ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-500 hover:to-amber-500 text-slate-950 ring-2 ring-yellow-400 cursor-pointer shadow-md'
                      : 'bg-amber-400 hover:bg-amber-500 text-slate-950 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin text-amber-950' : ''}`} />
                {isRolling
                  ? 'Mengocok Dadu...'
                  : isHopping && diceRoll
                  ? `Maju ${diceRoll[0] + diceRoll[1]} Petak!`
                  : isDoubleRoll
                  ? '🎲 Kocok Lagi! (Kembar ✨)'
                  : !isMyTurn
                  ? 'Tunggu Giliran'
                  : 'Kocok Dadu!'}
              </button>

              {/* Buy Property or Corruption Button */}
              {canBuyProperty ? (
                (() => {
                  const buyPrice = activePlayer.characterId === 'menteri_segala_urusan'
                    ? Math.round(currentTile.price * 0.8)
                    : currentTile.price;
                  const canAffordBuy = activePlayer.money >= buyPrice;
                  return (
                    <button
                      onClick={onBuyProperty}
                      disabled={!canAffordBuy || activePlayer.isBot || !isMyTurn}
                      className={`py-3 px-3 rounded-xl font-bold text-xs comic-box-sm comic-btn-hover flex items-center justify-center gap-1.5 ${
                        canAffordBuy && !activePlayer.isBot && isMyTurn
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Building className="w-4 h-4" />
                      {activePlayer.characterId === 'menteri_segala_urusan'
                        ? `Beli (Diskon PSN: ${formatRupiah(buyPrice)})`
                        : `Beli Kavling (${formatRupiah(buyPrice)})`}
                    </button>
                  );
                })()
              ) : (
                <button
                  onClick={onOpenCorruption}
                  disabled={activePlayer.isBot || !isMyTurn}
                  className={`py-3 px-3 rounded-xl font-bold text-xs comic-box-sm comic-btn-hover flex items-center justify-center gap-1.5 ${
                    !activePlayer.isBot && isMyTurn
                      ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Korupsi Bawah Meja
                </button>
              )}

              {/* Sabotage / Joint Venture Button */}
              <button
                onClick={onOpenSabotage}
                disabled={activePlayer.isBot || activePlayer.inJail || !isMyTurn}
                className={`py-3 px-3 rounded-xl font-bold text-xs comic-box-sm comic-btn-hover flex items-center justify-center gap-1.5 ${
                  !activePlayer.isBot && !activePlayer.inJail && isMyTurn
                    ? 'bg-purple-700 hover:bg-purple-800 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <Zap className="w-4 h-4 text-yellow-300" />
                Sabotase & Kongsi
              </button>

              {/* End Turn Button */}
              <button
                onClick={onEndTurn}
                disabled={!canEndTurn || activePlayer.isBot || !isMyTurn}
                className={`py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-wider comic-box-sm comic-btn-hover flex items-center justify-center gap-1.5 ${
                  canEndTurn && !activePlayer.isBot && isMyTurn
                    ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Selesai Giliran
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

