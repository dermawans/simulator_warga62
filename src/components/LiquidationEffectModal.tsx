import React, { useEffect, useState } from 'react';
import { formatRupiah } from '../utils/formatters';
import { soundManager } from '../utils/audio';
import { Flame, ArrowDown, Building2, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

export interface LiquidatedPropertyInfo {
  id: number;
  name: string;
  city?: string;
  price: number;
  houses: number;
  refundAmount: number;
  colorTag?: string;
}

interface LiquidationEffectModalProps {
  playerName: string;
  playerAvatar: string;
  properties: LiquidatedPropertyInfo[];
  isTotalBankruptcy: boolean;
  totalCashRecovered: number;
  onComplete: () => void;
}

export const LiquidationEffectModal: React.FC<LiquidationEffectModalProps> = ({
  playerName,
  playerAvatar,
  properties,
  isTotalBankruptcy,
  totalCashRecovered,
  onComplete,
}) => {
  const [animationMode, setAnimationMode] = useState<'BURN' | 'FALL'>('BURN');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Play dramatic liquidation audio sequence
    soundManager.playGavel();
    
    // Efek suara api menderu (roaring fire & deep rumble)
    setTimeout(() => {
      soundManager.playRoaringFire();
    }, 120);

    // Efek suara kertas terbakar (crisp crackle & sizzle)
    setTimeout(() => {
      soundManager.playBurningPaper();
    }, 260);

    // Dentuman stempel & crash
    setTimeout(() => {
      soundManager.playCrash();
    }, 620);

    setIsAnimating(true);

    // Auto dismiss after dramatic effect duration
    const timer = setTimeout(() => {
      onComplete();
    }, 3800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      {/* Background Ember Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-orange-500 animate-ember shadow-lg"
            style={{
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 20}%`,
              animationDelay: `${Math.random() * 1.5}s`,
              animationDuration: `${Math.random() * 1.5 + 1.2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-lg w-full flex flex-col items-center text-center space-y-4">
        {/* Banner Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 border-2 border-slate-900 rounded-full text-white text-xs font-black uppercase tracking-widest shadow-md">
            <AlertTriangle className="w-4 h-4 text-yellow-300" />
            {isTotalBankruptcy ? '💥 EKSEKUSI PAILIT TOTAL' : '🏦 LIKUIDASI DANA DARURAT'}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-comic uppercase text-white drop-shadow-md">
            {isTotalBankruptcy
              ? `${playerName} Bangkrut Total!`
              : `Pelelangan Aset ${playerName}`}
          </h2>

          <p className="text-xs font-semibold text-amber-200">
            {isTotalBankruptcy
              ? 'Kas Rp 0 & seluruh sertifikat properti hangus disita bank!'
              : `Saldo kas menipis, aset dicairkan otomatis ke bank (+${formatRupiah(totalCashRecovered)})`}
          </p>
        </div>

        {/* Animation Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700 p-1.5 rounded-xl text-xs">
          <span className="text-[11px] text-slate-400 font-bold px-2">Efek Visual:</span>
          <button
            onClick={() => {
              setAnimationMode('BURN');
              soundManager.playRoaringFire();
              soundManager.playBurningPaper();
            }}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              animationMode === 'BURN'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Kertas Terbakar
          </button>
          <button
            onClick={() => {
              setAnimationMode('FALL');
              soundManager.playCrash();
            }}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              animationMode === 'FALL'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            Jatuh Bebas
          </button>
        </div>

        {/* Dramatic Property Cards Container */}
        <div className="relative w-full max-w-sm min-h-[300px] flex items-center justify-center py-2">
          {properties.slice(0, 3).map((prop, idx) => (
            <div
              key={prop.id}
              className={`w-full bg-amber-50 rounded-2xl border-4 border-slate-900 p-4 shadow-2xl relative overflow-hidden transition-all duration-300 ${
                animationMode === 'BURN' ? 'animate-burn-paper' : 'animate-free-fall'
              }`}
              style={{
                animationDelay: `${idx * 0.25}s`,
                zIndex: 10 - idx,
                marginTop: idx > 0 ? `-${idx * 20}px` : '0',
              }}
            >
              {/* Paper Texture line */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-red-700 border-b-2 border-slate-900" />

              {/* Fire edge overlay if in BURN mode */}
              {animationMode === 'BURN' && (
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-full blur-md opacity-80 animate-pulse pointer-events-none" />
              )}

              {/* Property Details */}
              <div className="pt-2 text-left space-y-2">
                <div className="flex items-center justify-between border-b-2 border-dashed border-slate-300 pb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                      Sertifikat Hak Milik (SHM)
                    </span>
                    <h3 className="text-lg font-black font-comic text-slate-950 mt-1 leading-tight">
                      {prop.name}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-600">
                      Kota: {prop.city || 'Nusantara'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-200 border-2 border-slate-900 flex items-center justify-center text-xl shrink-0">
                    🏢
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-500 font-medium">Harga Asli:</p>
                    <p className="font-mono font-bold text-slate-900">
                      {formatRupiah(prop.price)}
                    </p>
                  </div>
                  <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-300">
                    <p className="text-[10px] text-emerald-700 font-medium">Pencairan Bank (75%):</p>
                    <p className="font-mono font-bold text-emerald-800">
                      +{formatRupiah(prop.refundAmount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* GIANT RED STAMP SLAM */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-red-600 bg-red-600/10 text-red-600 font-black font-comic uppercase tracking-wider text-xl sm:text-2xl px-4 py-2 rounded-xl border-dashed rotate-[-12deg] shadow-lg animate-stamp-slam">
                  {isTotalBankruptcy ? 'DISITA PAILIT' : 'DILELANG BANK'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Action */}
        <div className="pt-2 w-full flex items-center justify-center">
          <button
            onClick={onComplete}
            className="py-2.5 px-6 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black font-comic uppercase tracking-wider rounded-xl comic-box-sm comic-btn-hover cursor-pointer shadow-md flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Lanjutkan Permainan
          </button>
        </div>
      </div>
    </div>
  );
};
