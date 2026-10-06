import React from 'react';
import { BoardTile, Player, EconomicCondition } from '../types/game';
import { formatShortRupiah } from '../utils/formatters';
import { UPGRADE_TIERS } from '../data/boardTiles';
import simulatorWniBanner from '../assets/images/simulator_wni_banner_1791190534170.jpg';

interface GameBoardProps {
  tiles: BoardTile[];
  players: Player[];
  activePlayer: Player;
  economic: EconomicCondition;
  arisanPot: number;
  diceRoll: [number, number];
  isRolling: boolean;
  onTileClick: (tile: BoardTile) => void;
  recentLog: string;
  hoppingPlayerId?: string | null;
  stepHighlightedTileId?: number | null;
  liquidatingTileIds?: number[];
}

// Function to map tile index to 13x13 grid coordinates
function getTileGridStyle(index: number): React.CSSProperties {
  let row = 1;
  let col = 1;

  if (index >= 0 && index <= 12) {
    // Bottom edge: index 0 to 12 -> row 13, col 1 to 13
    row = 13;
    col = index + 1;
  } else if (index >= 13 && index <= 24) {
    // Right edge: index 13 to 24 -> row 12 down to 1, col 13
    row = 13 - (index - 12);
    col = 13;
  } else if (index >= 25 && index <= 36) {
    // Top edge: index 25 to 36 -> row 1, col 12 down to 1
    row = 1;
    col = 13 - (index - 24);
  } else if (index >= 37 && index <= 47) {
    // Left edge: index 37 to 47 -> row 2 to 12, col 1
    row = index - 35;
    col = 1;
  }

  return {
    gridRow: row,
    gridColumn: col,
  };
}

export const GameBoard: React.FC<GameBoardProps> = ({
  tiles,
  players,
  activePlayer,
  economic,
  arisanPot,
  diceRoll,
  isRolling,
  onTileClick,
  recentLog,
  hoppingPlayerId,
  stepHighlightedTileId,
  liquidatingTileIds = []
}) => {
  return (
    <div className="relative w-full max-w-[960px] aspect-square mx-auto p-1.5 sm:p-3 bg-[#e2d5b5] rounded-3xl comic-box-lg select-none shadow-2xl">
      {/* 13x13 Grid Container */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(13, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(13, minmax(0, 1fr))'
        }}
        className="w-full h-full gap-0.5 sm:gap-1 relative"
      >
        {/* Render the 48 perimeter tiles */}
        {tiles.map((tile) => {
          const gridStyle = getTileGridStyle(tile.id);
          const owner = players.find((p) => p.id === tile.ownerId);
          const playersHere = players.filter((p) => p.position === tile.id && !p.isBankrupt);
          const isCorner = tile.type === 'corner' || tile.type === 'arisan' || tile.id === 0 || tile.id === 12 || tile.id === 24 || tile.id === 36;
          const isStepHighlighted = stepHighlightedTileId === tile.id;
          const isLiquidating = liquidatingTileIds.includes(tile.id);

          return (
            <div
              key={tile.id}
              style={gridStyle}
              onClick={() => onTileClick(tile)}
              className={`relative rounded-sm sm:rounded-md border border-slate-900 flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-150 ${
                isLiquidating
                  ? 'ring-2 sm:ring-4 ring-orange-500 bg-red-100 scale-105 z-30 shadow-xl animate-tile-burn'
                  : isStepHighlighted
                  ? 'ring-2 sm:ring-4 ring-amber-400 bg-amber-300 scale-105 z-20 shadow-lg animate-step-highlight'
                  : isCorner
                  ? 'bg-amber-200/90 font-bold hover:scale-[1.03]'
                  : 'bg-white/95 hover:scale-[1.03]'
              }`}
            >
              {/* Color header for city properties */}
              {tile.colorTag && (
                <div
                  className="w-full h-1 sm:h-2 border-b border-slate-900 shrink-0"
                  style={{ backgroundColor: isLiquidating ? '#ea580c' : tile.colorTag }}
                />
              )}

              {/* Tile Body */}
              <div className="p-0.5 flex flex-col items-center justify-center flex-1 text-center min-h-0">
                <span className="text-xs sm:text-base leading-none">{tile.icon}</span>
                <p className="text-[7px] sm:text-[9px] font-bold font-comic text-slate-900 leading-tight line-clamp-2 mt-0.5">
                  {tile.name}
                </p>

                {/* Price tag */}
                {tile.price > 0 && (
                  <p className="text-[6px] sm:text-[8px] font-mono font-bold text-slate-700 mt-0.5 hidden xs:block">
                    {formatShortRupiah(tile.price)}
                  </p>
                )}
              </div>

              {/* Ownership & Upgrade indicator */}
              {owner && (
                <div
                  className="w-full px-0.5 py-0.2 border-t border-slate-900 flex items-center justify-between text-[6px] sm:text-[8px] font-bold text-white shrink-0"
                  style={{ backgroundColor: owner.color }}
                >
                  <span className="truncate max-w-[30px]">{owner.name.split(' ')[0]}</span>
                  <span>{UPGRADE_TIERS[tile.houses].icon}</span>
                </div>
              )}

              {/* Burning / Liquidating Stamp Badge on Board */}
              {isLiquidating && (
                <div className="absolute inset-0 bg-red-950/70 flex flex-col items-center justify-center p-0.5 z-20 pointer-events-none animate-pulse">
                  <span className="text-sm">🔥</span>
                  <span className="text-[6px] sm:text-[8px] font-black font-comic text-yellow-300 bg-red-700 px-1 py-0.2 rounded border border-white uppercase tracking-wider rotate-[-10deg] shadow-md animate-stamp-slam">
                    LELANG
                  </span>
                </div>
              )}

              {/* Player tokens on this tile */}
              {playersHere.length > 0 && (
                <div className="absolute inset-0 bg-slate-900/10 pointer-events-none flex items-center justify-center flex-wrap gap-0.5 p-0.5">
                  {playersHere.map((p) => {
                    const isActive = p.id === activePlayer.id;
                    const isHopping = p.id === hoppingPlayerId;

                    return (
                      <div
                        key={p.id}
                        className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full border border-slate-950 flex items-center justify-center text-[9px] sm:text-xs font-bold shadow-md transition-all duration-150 ${
                          isHopping
                            ? 'animate-hop ring-2 ring-yellow-400 scale-125 z-30 shadow-xl'
                            : isActive
                            ? 'ring-1 sm:ring-2 ring-amber-400 scale-110 z-10'
                            : 'z-0'
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={`${p.name}: ${p.quote}`}
                      >
                        {p.avatarEmoji}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Center Area (Grid Rows 2 to 12, Columns 2 to 12) */}
        <div
          style={{
            gridRow: '2 / 13',
            gridColumn: '2 / 13',
          }}
          className="relative bg-amber-50/95 rounded-2xl border-2 border-slate-900 p-2 sm:p-5 flex flex-col justify-between overflow-hidden shadow-inner"
        >
          {/* Top Center: Game Branding & Satirical Subtitle */}
          <div className="flex items-start justify-between gap-2 border-b-2 border-slate-900 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">🇮🇩</span>
                <h1 className="text-lg sm:text-2xl font-black font-comic tracking-tight text-slate-900 uppercase">
                  SIMULATOR WNI
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-red-600 text-white font-bold text-[10px] rounded-md uppercase">
                  Edisi Satir
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-600 font-medium italic">
                "Monopoli Kehidupan Nyata: Dari Gaji UMR Sampai OTT KPK"
              </p>
            </div>

            {/* Jackpot Arisan RT Display */}
            <div className="bg-amber-200 border-2 border-slate-900 rounded-xl px-2.5 py-1 text-right shadow-xs">
              <p className="text-[9px] sm:text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                Kas Arisan RT 🎁
              </p>
              <p className="text-xs sm:text-base font-black font-mono text-slate-950">
                {formatShortRupiah(arisanPot)}
              </p>
            </div>
          </div>

          {/* Center Graphic Illustration Banner */}
          <div className="relative my-auto flex flex-col items-center justify-center py-1 sm:py-2">
            <div className="w-full max-h-36 sm:max-h-48 rounded-xl overflow-hidden border-2 border-slate-900 relative shadow-md">
              <img
                src={simulatorWniBanner}
                alt="Simulator WNI Satir Monopoli"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2 sm:p-3">
                <p className="text-[11px] sm:text-xs text-amber-200 font-bold drop-shadow-sm font-comic">
                  {recentLog || 'Selamat datang di Simulator WNI! Kocok dadu dan nikmati birokrasi nusantara.'}
                </p>
              </div>
            </div>
          </div>

          {/* Dice & Active Turn Status Display in Center Bottom */}
          <div className="flex items-center justify-between gap-3 bg-white/90 p-2 sm:p-3 rounded-xl border-2 border-slate-900">
            {/* Active Turn indicator */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-slate-900 flex items-center justify-center text-lg sm:text-xl shrink-0"
                style={{ backgroundColor: activePlayer.color }}
              >
                {activePlayer.avatarEmoji}
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Giliran Warga:
                </p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 font-comic">
                  {activePlayer.name} {activePlayer.isBot ? '(Warga Bot)' : ''}
                </p>
              </div>
            </div>

            {/* 3D-styled Dice */}
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 sm:w-11 sm:h-11 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center text-base sm:text-xl font-black font-mono shadow-sm ${
                  isRolling ? 'animate-dice bg-amber-100 text-amber-900' : 'text-slate-900'
                }`}
              >
                {diceRoll[0]}
              </div>
              <div
                className={`w-9 h-9 sm:w-11 sm:h-11 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-center text-base sm:text-xl font-black font-mono shadow-sm ${
                  isRolling ? 'animate-dice bg-amber-100 text-amber-900' : 'text-slate-900'
                }`}
              >
                {diceRoll[1]}
              </div>
              <span className="text-xs sm:text-sm font-black font-comic text-slate-700 ml-1">
                = {diceRoll[0] + diceRoll[1]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
