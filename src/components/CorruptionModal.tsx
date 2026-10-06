import React, { useState } from 'react';
import { Player, EconomicCondition } from '../types/game';
import { CORRUPTION_SCHEMES } from '../data/events';
import { formatRupiah } from '../utils/formatters';
import { soundManager } from '../utils/audio';
import { X, ShieldAlert, DollarSign, AlertTriangle, Siren } from 'lucide-react';

interface CorruptionModalProps {
  player: Player;
  economic: EconomicCondition;
  onClose: () => void;
  onCommitCorruption: (scheme: typeof CORRUPTION_SCHEMES[0], isBusted: boolean) => void;
}

export const CorruptionModal: React.FC<CorruptionModalProps> = ({
  player,
  economic,
  onClose,
  onCommitCorruption
}) => {
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedScheme = CORRUPTION_SCHEMES.find((s) => s.id === selectedSchemeId);

  const handleExecute = () => {
    if (!selectedScheme) return;
    setIsProcessing(true);

    soundManager.playDiceRoll();

    setTimeout(() => {
      // Calculate risk: base scheme risk + player's current karma * multiplier
      const effectiveRisk = Math.min(
        95,
        Math.round(selectedScheme.riskPercent * economic.corruptionRiskMultiplier + player.karma * 0.4)
      );

      const roll = Math.random() * 100;
      const isBusted = roll < effectiveRisk;

      if (isBusted) {
        soundManager.playSiren();
        setTimeout(() => soundManager.playGavel(), 500);
      } else {
        soundManager.playMoney();
      }

      setIsProcessing(false);
      onCommitCorruption(selectedScheme, isBusted);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-amber-50 rounded-2xl comic-box-lg max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header with satirical police tape vibe */}
        <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/20 rounded-xl text-2xl">💼</span>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-amber-200">Jalur Cepat Kekayaan</p>
              <h3 className="text-xl font-bold font-comic">Birokrasi Bawah Meja & Korupsi</h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isProcessing}
            className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player current Karma Warning */}
        <div className="p-4 bg-amber-100 border-b border-amber-300 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span className="font-semibold text-slate-800">
              Karma DPO Saat Ini: <span className="font-bold text-red-600">{player.karma}%</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-600" />
            <span className="text-slate-600">Pengali Risiko Periode Ini: <span className="font-bold">{economic.corruptionRiskMultiplier}x</span></span>
          </div>
        </div>

        {/* Schemes List */}
        <div className="p-5 space-y-3 max-h-[50vh] overflow-y-auto">
          {CORRUPTION_SCHEMES.map((scheme) => {
            const calculatedRisk = Math.min(
              95,
              Math.round(scheme.riskPercent * economic.corruptionRiskMultiplier + player.karma * 0.4)
            );
            const isSelected = selectedSchemeId === scheme.id;

            return (
              <div
                key={scheme.id}
                onClick={() => !isProcessing && setSelectedSchemeId(scheme.id)}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-100 border-red-600 shadow-md ring-2 ring-red-400'
                    : 'bg-white border-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl p-1 bg-amber-50 rounded-lg">{scheme.icon}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm font-comic">{scheme.name}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{scheme.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-emerald-600 font-mono block">
                      +{formatRupiah(scheme.reward)}
                    </span>
                    <span className="text-[11px] font-semibold text-rose-600">
                      Risiko OTT: {calculatedRisk}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer & Action */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 italic max-w-xs">
            ⚠️ "KPK mengintai gerak-gerik rekening mencurigakan. Jika tertangkap, denda sita dan langsung kurung di Sukamiskin!"
          </p>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl comic-box-sm cursor-pointer"
            >
              Batal / Alim
            </button>
            <button
              disabled={!selectedSchemeId || isProcessing}
              onClick={handleExecute}
              className={`py-2.5 px-5 text-xs font-bold rounded-xl comic-box-sm comic-btn-hover flex items-center gap-1.5 cursor-pointer ${
                !selectedSchemeId || isProcessing
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isProcessing ? (
                <>
                  <Siren className="w-4 h-4 animate-spin text-yellow-300" />
                  Mencuci Uang...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  Gass Transaksi Bawah Meja!
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
