import React from 'react';
import { Player } from '../types/game';
import { formatRupiah } from '../utils/formatters';
import { soundManager } from '../utils/audio';
import { X, Siren, ShieldCheck, HeartHandshake, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KarmaInfoModalProps {
  player: Player | null;
  onClose: () => void;
  onDonateCharity?: () => void;
}

export const KarmaInfoModal: React.FC<KarmaInfoModalProps> = ({
  player,
  onClose,
  onDonateCharity
}) => {
  const currentKarma = player?.karma ?? 0;

  const getStatusLevel = (karma: number) => {
    if (karma >= 70) {
      return {
        label: 'BURONAN DPO / TARGET UTAMA KPK',
        color: 'text-red-700 bg-red-100 border-red-400',
        badge: 'bg-red-600 text-white',
        desc: 'Rekening dibekukan, intelijen mengintai setiap langkah. Risiko OTT KPK mencapai 80%+!'
      };
    }
    if (karma >= 40) {
      return {
        label: 'DALAM PENGAWASAN INTELEJEN PAJAK',
        color: 'text-amber-800 bg-amber-100 border-amber-400',
        badge: 'bg-amber-500 text-slate-950',
        desc: 'Kecurigaan PPATK meningkat akibat transaksi mencurigakan. Hati-hati saat mark-up proyek!'
      };
    }
    return {
      label: 'WARGA BERSIH & BERKAH',
      color: 'text-emerald-800 bg-emerald-100 border-emerald-400',
      badge: 'bg-emerald-600 text-white',
      desc: 'Catatan keuangan bersih, aman dari incaran sidak dan penggerebekan KPK.'
    };
  };

  const status = getStatusLevel(currentKarma);

  const handleCharity = () => {
    if (onDonateCharity && player && player.money >= 2000000) {
      soundManager.playMoney();
      onDonateCharity();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-amber-50 rounded-2xl comic-box-lg max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-amber-600 to-slate-900 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/20 rounded-xl text-2xl">⚖️</span>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-amber-200">Sistem Hukum & Birokrasi RI</p>
              <h3 className="text-xl font-bold font-comic">Panduan Lengkap Karma & Risiko OTT KPK</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-700">
          {/* Active Player Live Karma Status */}
          {player && (
            <div className={`p-4 rounded-xl border-2 space-y-2 ${status.color}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{player.avatarEmoji}</span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm font-comic">{player.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${status.badge}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black font-mono leading-none">
                    {player.karma}%
                  </p>
                  <p className="text-[10px] font-semibold opacity-75">Tingkat Risiko DPO</p>
                </div>
              </div>
              <p className="text-[11px] font-medium leading-relaxed">
                {status.desc}
              </p>
            </div>
          )}

          {/* Explanation: Apa itu Karma? */}
          <div className="bg-white p-3.5 rounded-xl comic-box-sm space-y-1">
            <h4 className="font-bold text-slate-900 font-comic text-xs uppercase tracking-wide flex items-center gap-1.5">
              <Siren className="w-4 h-4 text-red-600" /> Apa Itu Fitur Karma di Simulator WNI?
            </h4>
            <p className="leading-relaxed">
              <strong>Karma Meter (0% - 100%)</strong> mencerminkan akumulasi dosa birokrasi, penyelewengan anggaran, dan jejak transaksi kotor warga. Semakin tinggi Karma Anda, semakin besar kemungkinan Anda <strong>diciduk OTT oleh KPK</strong>, aset disita, denda berlipat ganda, dan langsung digelandang ke <strong>Lapas Sukamiskin</strong>.
            </p>
          </div>

          {/* Two-Column Breakdown: Dari Mana Karma Datang & Cara Mengurangi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Karma Gain */}
            <div className="bg-red-50/80 p-3 rounded-xl border border-red-200 space-y-2">
              <p className="font-bold text-red-900 font-comic text-xs flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-red-600" />
                Penyebab Karma Naik (+):
              </p>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex justify-between items-center text-slate-800">
                  <span>Amplop Cokelat Lurah:</span>
                  <span className="font-bold text-red-600 font-mono">+15%</span>
                </li>
                <li className="flex justify-between items-center text-slate-800">
                  <span>Mark-Up Pengadaan Laptop:</span>
                  <span className="font-bold text-red-600 font-mono">+30%</span>
                </li>
                <li className="flex justify-between items-center text-slate-800">
                  <span>Sunat Dana Bansos & Bencana:</span>
                  <span className="font-bold text-red-600 font-mono">+50%</span>
                </li>
                <li className="flex justify-between items-center text-slate-800">
                  <span>Jual Izin Tambang Ilegal:</span>
                  <span className="font-bold text-red-600 font-mono">+75%</span>
                </li>
                <li className="flex justify-between items-center text-slate-800">
                  <span>Pembukuan Siluman (Pajak):</span>
                  <span className="font-bold text-red-600 font-mono">+25%</span>
                </li>
                <li className="flex justify-between items-center text-slate-800">
                  <span>Viral Parkir Ngawur / Damai:</span>
                  <span className="font-bold text-red-600 font-mono">+5% ~ +15%</span>
                </li>
              </ul>
            </div>

            {/* Karma Reduction */}
            <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 space-y-2">
              <p className="font-bold text-emerald-900 font-comic text-xs flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                Cara Menghapus Karma (-):
              </p>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex justify-between items-center text-slate-800">
                  <span>Lapor SPT Pajak Jujur:</span>
                  <span className="font-bold text-emerald-600 font-mono">-15%</span>
                </li>
                <li className="flex justify-between items-center text-slate-800">
                  <span>Ikut & Menang Arisan RT:</span>
                  <span className="font-bold text-emerald-600 font-mono">-10%</span>
                </li>
                <li className="flex justify-between items-center text-slate-800">
                  <span>War Takjil & Berbagi Jajanan:</span>
                  <span className="font-bold text-emerald-600 font-mono">-10%</span>
                </li>
                <li className="flex justify-between items-center text-slate-800">
                  <span>Surat SP3 Pemutihan Kasus:</span>
                  <span className="font-bold text-emerald-600 font-mono">-30%</span>
                </li>
                <li className="flex justify-between items-center text-slate-800">
                  <span>Sedekah Kas Warga (Donasi):</span>
                  <span className="font-bold text-emerald-600 font-mono">-15%</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Charity Action if Player has high karma and money */}
          {player && onDonateCharity && (
            <div className="p-3 bg-white rounded-xl comic-box-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900 font-comic text-xs">
                  Bersihkan Karma Lewat Sedekah Kas Warga?
                </p>
                <p className="text-[11px] text-slate-600">
                  Sumbang kas warga sebesar <strong>Rp 2.000.000</strong> untuk membersihkan Karma sebesar <strong>-15%</strong>.
                </p>
              </div>
              <button
                onClick={handleCharity}
                disabled={player.money < 2000000 || player.karma <= 0}
                className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs whitespace-nowrap comic-box-sm comic-btn-hover flex items-center gap-1.5 cursor-pointer"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                Sedekah (Rp 2 Jt)
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-amber-100/70 border-t border-amber-300 flex justify-end px-5">
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer text-xs"
          >
            Tutup Informasi
          </button>
        </div>
      </div>
    </div>
  );
};
