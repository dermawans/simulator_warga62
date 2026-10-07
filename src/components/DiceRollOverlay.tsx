import React from 'react';
import { Player } from '../types/game';

interface DiceFaceProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  isRolling?: boolean;
}

export const DiceFace: React.FC<DiceFaceProps> = ({
  value,
  size = 'md',
  isRolling = false,
}) => {
  const safeVal = Math.min(6, Math.max(1, Math.round(value || 1)));

  // Size configurations
  const dimClass =
    size === 'lg'
      ? 'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-3'
      : size === 'md'
      ? 'w-11 h-11 sm:w-14 sm:h-14 rounded-xl border-2 sm:border-3'
      : 'w-8 h-8 sm:w-9 sm:h-9 rounded-lg border-2';

  const dotSize =
    size === 'lg'
      ? 'w-3 h-3 sm:w-3.5 sm:h-3.5'
      : size === 'md'
      ? 'w-2 h-2 sm:w-2.5 sm:h-2.5'
      : 'w-1.5 h-1.5';

  // Authentic pip positions on a 3x3 grid (rows 1-3, cols 1-3)
  const renderPips = () => {
    switch (safeVal) {
      case 1:
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`${
                size === 'lg' ? 'w-5 h-5 sm:w-6 sm:h-6' : size === 'md' ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-2.5 h-2.5'
              } rounded-full bg-rose-600 shadow-inner`}
            />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full p-1.5 sm:p-2 flex flex-col justify-between">
            <div className="flex justify-start">
              <span className={`${dotSize} rounded-full bg-slate-900`} />
            </div>
            <div className="flex justify-end">
              <span className={`${dotSize} rounded-full bg-slate-900`} />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full p-1.5 sm:p-2 flex flex-col justify-between">
            <div className="flex justify-start">
              <span className={`${dotSize} rounded-full bg-slate-900`} />
            </div>
            <div className="flex justify-center">
              <span className={`${dotSize} rounded-full bg-slate-900`} />
            </div>
            <div className="flex justify-end">
              <span className={`${dotSize} rounded-full bg-slate-900`} />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full p-1.5 sm:p-2 flex flex-col justify-between">
            <div className="flex justify-between">
              <span className={`${dotSize} rounded-full bg-slate-900`} />
              <span className={`${dotSize} rounded-full bg-slate-900`} />
            </div>
            <div className="flex justify-between">
              <span className={`${dotSize} rounded-full bg-slate-900`} />
              <span className={`${dotSize} rounded-full bg-slate-900`} />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full p-1.5 sm:p-2 flex flex-col justify-between">
            <div className="flex justify-between">
              <span className={`${dotSize} rounded-full bg-slate-900`} />
              <span className={`${dotSize} rounded-full bg-slate-900`} />
            </div>
            <div className="flex justify-center">
              <span className={`${dotSize} rounded-full bg-rose-600`} />
            </div>
            <div className="flex justify-between">
              <span className={`${dotSize} rounded-full bg-slate-900`} />
              <span className={`${dotSize} rounded-full bg-slate-900`} />
            </div>
          </div>
        );
      case 6:
      default:
        return (
          <div className="w-full h-full p-1.5 sm:p-2 flex flex-col justify-between">
            <div className="flex justify-between">
              <span className={`${dotSize} rounded-full bg-slate-900`} />
              <span className={`${dotSize} rounded-full bg-slate-900`} />
            </div>
            <div className="flex justify-between">
              <span className={`${dotSize} rounded-full bg-slate-900`} />
              <span className={`${dotSize} rounded-full bg-slate-900`} />
            </div>
            <div className="flex justify-between">
              <span className={`${dotSize} rounded-full bg-slate-900`} />
              <span className={`${dotSize} rounded-full bg-slate-900`} />
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={`relative bg-gradient-to-br from-white via-slate-50 to-amber-50/80 border-slate-900 shadow-md flex items-center justify-center select-none ${dimClass} ${
        isRolling ? 'ring-2 ring-amber-400 bg-amber-100' : ''
      }`}
      style={{
        boxShadow: isRolling
          ? '0 0 15px rgba(245, 158, 11, 0.5)'
          : '3px 3px 0px #0f172a, inset 0 1px 2px rgba(255, 255, 255, 0.9)',
      }}
    >
      {renderPips()}

      {/* Numerical digit helper badge in corner */}
      <span
        className={`absolute -bottom-1.5 -right-1.5 font-mono font-black rounded-md px-1 py-0.2 border border-slate-900 text-slate-900 bg-amber-300 leading-none ${
          size === 'lg' ? 'text-[11px]' : size === 'md' ? 'text-[9px]' : 'text-[7px]'
        }`}
      >
        {safeVal}
      </span>
    </div>
  );
};

export interface DiceOverlayState {
  isOpen: boolean;
  isRolling: boolean;
  dice: [number, number];
  player: Player;
  totalSteps: number;
}

interface DiceRollOverlayProps {
  state: DiceOverlayState | null;
}

export const DiceRollOverlay: React.FC<DiceRollOverlayProps> = ({ state }) => {
  if (!state || !state.isOpen) return null;

  const { isRolling, dice, player, totalSteps } = state;
  const isDoubles = !isRolling && dice[0] === dice[1];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px] transition-all duration-200">
      <div className="relative max-w-sm w-full bg-amber-50 rounded-3xl border-4 border-slate-900 comic-box-lg p-5 sm:p-6 flex flex-col items-center text-center shadow-2xl animate-dice-result-pop">
        {/* Roller Header */}
        <div className="flex items-center gap-2 mb-3 px-3 py-1 bg-white rounded-full border-2 border-slate-900 shadow-xs">
          <span
            className="w-6 h-6 rounded-full border border-slate-900 flex items-center justify-center text-xs"
            style={{ backgroundColor: player.color }}
          >
            {player.avatarEmoji}
          </span>
          <span className="font-comic font-black text-xs text-slate-900">
            {player.name} {player.isBot ? '(Bot)' : ''}
          </span>
        </div>

        {/* Action Title */}
        <h3 className="text-base sm:text-lg font-black font-comic uppercase tracking-wide text-slate-900 mb-4">
          {isRolling ? '🎲 Mengocok Dadu...' : '✨ Dadu Telah Keluar!'}
        </h3>

        {/* Dice Showcase Area */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 my-2 sm:my-3">
          <div className={isRolling ? 'animate-dice-tumble' : 'animate-dice-land'}>
            <DiceFace value={dice[0]} size="lg" isRolling={isRolling} />
          </div>

          <div className="text-2xl sm:text-3xl font-black font-comic text-slate-900">
            +
          </div>

          <div
            className={isRolling ? 'animate-dice-tumble' : 'animate-dice-land'}
            style={{ animationDelay: isRolling ? '0.1s' : '0.06s' }}
          >
            <DiceFace value={dice[1]} size="lg" isRolling={isRolling} />
          </div>
        </div>

        {/* Result Announcement Banner */}
        <div className="w-full mt-4">
          {isRolling ? (
            <div className="py-2.5 px-4 bg-amber-200/80 rounded-2xl border-2 border-slate-900 flex items-center justify-center gap-2">
              <span className="text-base animate-spin">🎲</span>
              <span className="text-xs font-black font-comic text-amber-950 animate-pulse">
                Mengocok angka hoki...
              </span>
            </div>
          ) : (
            <div className="space-y-2 animate-dice-result-pop">
              <div
                className={`py-3 px-4 rounded-2xl border-3 border-slate-900 comic-box-sm ${
                  isDoubles
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 ring-2 ring-yellow-400'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl sm:text-2xl font-black font-mono">
                    {dice[0]} + {dice[1]} = {totalSteps}
                  </span>
                </div>

                <p
                  className={`text-xs sm:text-sm font-black font-comic tracking-wide uppercase mt-0.5 ${
                    isDoubles ? 'text-slate-950' : 'text-yellow-300'
                  }`}
                >
                  {isDoubles ? '🎉 DOUBLE ANGKA KEMBAR! HOKI SULTAN!' : `Maju ${totalSteps} Petak!`}
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-600 font-comic">
                <span>🏃 Bersiap melangkah {totalSteps} langkah ke depan...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
