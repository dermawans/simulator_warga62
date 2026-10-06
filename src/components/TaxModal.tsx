import React from 'react';
import { Player, EconomicCondition } from '../types/game';
import { formatRupiah } from '../utils/formatters';
import { soundManager } from '../utils/audio';
import { Landmark, FileCheck, FileX } from 'lucide-react';

interface TaxModalProps {
  player: Player;
  netWorth: number;
  economic: EconomicCondition;
  onPayHonest: (taxAmount: number) => void;
  onEvadeTax: (bribeTaxAmount: number) => void;
}

export const TaxModal: React.FC<TaxModalProps> = ({
  player,
  netWorth,
  economic,
  onPayHonest,
  onEvadeTax
}) => {
  // Determine progressive bracket
  let taxRate = 0.10;
  let bracketLabel = 'Tarif Normal (Kekayaan < Rp 20 Jt)';

  if (netWorth > 100000000) {
    taxRate = 0.25;
    bracketLabel = 'Tarif Sultan Konglomerat (> Rp 100 Jt)';
  } else if (netWorth > 50000000) {
    taxRate = 0.20;
    bracketLabel = 'Tarif Tajir Melintir (Rp 50 Jt - 100 Jt)';
  } else if (netWorth > 20000000) {
    taxRate = 0.15;
    bracketLabel = 'Tarif Menengah Mapan (Rp 20 Jt - 50 Jt)';
  }

  // Base calculated tax
  const fullTax = Math.round(netWorth * taxRate * 0.1 * economic.taxMultiplier); // 1% - 2.5% effective of net worth for game balance
  const bribeTax = Math.round(fullTax * 0.35); // 35% under the table

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-amber-50 rounded-2xl comic-box-lg max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-yellow-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/20 rounded-xl text-2xl">🏛️</span>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-amber-100">Audit SPT Tahunan</p>
              <h3 className="text-xl font-bold font-comic">Kantor Pajak Progresif</h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            Petugas pajak meneliti laporan kekayaan <span className="font-bold">{player.name}</span>. Berdasarkan sistem pajak progresif, warga yang asetnya melimpah wajib menyetor pajak pembangunan!
          </p>

          <div className="bg-white p-3.5 rounded-xl comic-box-sm space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Estimasi Nilai Kekayaan Total:</span>
              <span className="font-bold text-slate-900 font-mono">{formatRupiah(netWorth)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Kategori Golongan:</span>
              <span className="font-bold text-amber-700">{bracketLabel}</span>
            </div>
            <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-1.5">
              <span>Kewajiban Pajak Bersih:</span>
              <span className="font-bold text-rose-600 text-sm font-mono">{formatRupiah(fullTax)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Pilih Pendekatan WNI Anda:
            </p>

            {/* Option 1: Honest */}
            <button
              onClick={() => {
                soundManager.playMoney();
                onPayHonest(fullTax);
              }}
              className="w-full p-3.5 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-500 rounded-xl text-left transition-all comic-btn-hover flex items-start gap-3 cursor-pointer"
            >
              <FileCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900 text-sm font-comic">
                  1. Lapor SPT Jujur & Taat Pajak ({formatRupiah(fullTax)})
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Warga teladan berbakti bagi nusa bangsa. Karma berkurang -15% dan terbebas dari radar KPK.
                </p>
              </div>
            </button>

            {/* Option 2: Tax evasion under the table */}
            <button
              onClick={() => {
                soundManager.playSiren();
                onEvadeTax(bribeTax);
              }}
              className="w-full p-3.5 bg-rose-50 hover:bg-rose-100 border-2 border-rose-500 rounded-xl text-left transition-all comic-btn-hover flex items-start gap-3 cursor-pointer"
            >
              <FileX className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900 text-sm font-comic">
                  2. Buat Pembukuan Siluman Bawah Meja ({formatRupiah(bribeTax)})
                </p>
                <p className="text-xs text-rose-700 mt-0.5">
                  Bayar jasa pelicin konsultan 35% saja, tapi risiko diincar KPK & Karma meningkat +25%!
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
