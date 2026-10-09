import React from 'react';
import { X, BookOpen, Building, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-amber-50 rounded-2xl comic-box-lg max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-yellow-300 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-lg font-bold font-comic">Panduan & Tata Tertib Warga62</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-800 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto text-xs text-slate-700 leading-relaxed">
          <div className="p-3 bg-white rounded-xl comic-box-sm space-y-1">
            <h4 className="font-bold text-slate-900 font-comic text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> 1. Kondisi Game Over & Cara Menang
            </h4>
            <p>
              Permainan Simulator Warga62 memiliki 3 kondisi <strong>GAME OVER & Kemenangan</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-1 font-medium">
              <li>
                <strong>Kemenangan Eliminasi (Bangkrut Total)</strong>: Singkirkan seluruh warga lawan! Lawan yang kehabisan uang kas DAN seluruh aset propertinya habis disita bank akan dinyatakan <em>Pailit</em>. Warga terakhir yang bertahan dinobatkan sebagai <strong>Sultan Tunggal Warga62</strong>.
              </li>
              <li>
                <strong>Target Taipan Sultan (Rp 100.000.000)</strong>: Warga pertama yang berhasil mencetak Kekayaan Bersih (Kas + Seluruh Properti) mencapai <strong>Rp 100 Juta</strong> langsung dinobatkan sebagai pemenang tanpa menunggu lawan bangkrut!
              </li>
              <li>
                <strong>Batas 50 Putaran Selesai</strong>: Jika mencapai 50 putaran, permainan otomatis selesai dan warga dengan Kekayaan Bersih tertinggi keluar sebagai pemenang.
              </li>
            </ul>
          </div>

          <div className="p-3 bg-white rounded-xl comic-box-sm space-y-1">
            <h4 className="font-bold text-slate-900 font-comic text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-500" /> 2. Investasi Properti & Sistem Likuidasi Otomatis
            </h4>
            <p>
              Beli kavling tanah saat mendarat di petak kosong. Kamu bisa meng-upgrade properti milikmu hingga 4 tingkatan (Lapak PKL, Ruko 2 Lantai, Mall Megah, Superblok Konglomerat).
            </p>
            <div className="mt-1.5 p-2 bg-amber-50 border border-amber-300 rounded-lg text-amber-900">
              <strong>🏦 Dana Talangan Likuidasi Otomatis:</strong> Jika saldo kas Anda mencapai Rp 0 akibat bayar sewa, denda KPK, atau pajak SPT, sistem perbankan akan <em>otomatis menjual aset properti Anda</em> (rumah renovasi terlebih dahulu, lalu kavling seharga 75% harga pasar) agar Anda kembali memiliki uang kas dan tidak langsung bangkrut! Anda juga dapat menggadaikan/menjual properti secara manual lewat menu rincian kavling kapan saja.
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl comic-box-sm space-y-1">
            <h4 className="font-bold text-slate-900 font-comic text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> 3. Lapas Sukamiskin & Birokrasi Bawah Meja
            </h4>
            <p>
              Jika tertangkap OTT KPK atau terjaring Razia Polisi, Anda akan dijebloskan ke <strong>Lapas Sukamiskin</strong> selama 2-3 giliran.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-1 font-medium">
              <li>
                <strong>Opsi 1 (Jalani Hukuman)</strong>: Klik tombol <em>Jalani Hukuman (-1 Giliran)</em> untuk menjalani masa tahanan per giliran sampai bebas.
              </li>
              <li>
                <strong>Opsi 2 (Uang Damai / Bebas Cepat)</strong>: Bayar suap sipir Rp 2.500.000 untuk langsung keluar dan bebas melempar dadu pada giliran berikutnya. Jika uang kas 0, aset kavling akan otomatis dicairkan sehingga Anda memiliki dana!
              </li>
            </ul>
          </div>

          <div className="p-3 bg-white rounded-xl comic-box-sm space-y-1">
            <h4 className="font-bold text-slate-900 font-comic text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> 4. Pajak Progresif & Ekonomi Dinamis
            </h4>
            <p>
              Semakin kaya asetmu, semakin besar tarif pajak saat mendarat di Kantor Ditjen Pajak (10% hingga 25%). Kondisi ekonomi juga berganti setiap beberapa putaran (Inflasi Tinggi, Bansos Turun, Tahun Politik, atau Krisis Moneter) yang mengubah tarif sewa dan risiko.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-amber-100 border-t border-amber-300 text-right px-6">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl comic-box-sm cursor-pointer"
          >
            Paham, Ayo Main!
          </button>
        </div>
      </div>
    </div>
  );
};
