import React, { useState, useEffect } from 'react';
import {
  X,
  Bug,
  Lightbulb,
  History,
  Send,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Info,
  Smartphone,
  Laptop,
  Check,
  Flame,
  MessageSquareHeart,
} from 'lucide-react';
import { feedbackService, FeedbackReport } from '../services/feedback';
import { soundManager } from '../utils/audio';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserName?: string;
  roundCount?: number;
  multiplayerRoomCode?: string | null;
}

const BUG_CATEGORIES = [
  { id: 'dadu_pion', label: '🎲 Dadu & Pergerakan Pion Macet' },
  { id: 'mabar_online', label: '🌐 Mabar Online / Room Multiplayer' },
  { id: 'transaksi_kavling', label: '💰 Kas Uang & Jual-Beli Kavling' },
  { id: 'lapas_kpk', label: '⚖️ Lapas Sukamiskin & Kasus KPK' },
  { id: 'tampilan_hp', label: '📱 Tampilan UI / Tombol di HP' },
  { id: 'suara_audio', label: '🔊 Masalah Musik & Efek Suara' },
  { id: 'lainnya', label: '❓ Eror / Masalah Lainnya' },
];

const FEATURE_CATEGORIES = [
  { id: 'petak_kota', label: '🗺️ Usulan Kota / Kavling Daerah Baru' },
  { id: 'karakter_baru', label: '🎭 Profesi / Karakter Warga Baru' },
  { id: 'kartu_kocak', label: '🃏 Ide Kartu Nasib / Razia Lucu' },
  { id: 'gameplay_mini', label: '⚡ Mode Main / Mini-game Tambahan' },
  { id: 'fitur_mabar', label: '🤝 Fitur Sosial & Mabar Teman' },
  { id: 'ide_bebas', label: '💡 Ide Liar & Saran Pengembangan' },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentUserName = 'Warga 62',
  roundCount,
  multiplayerRoomCode,
}) => {
  const [activeTab, setActiveTab] = useState<'BUG' | 'FEATURE' | 'HISTORY'>('BUG');
  const [senderName, setSenderName] = useState(currentUserName);
  const [category, setCategory] = useState(BUG_CATEGORIES[0].label);
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH'>('NORMAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [includeDeviceInfo, setIncludeDeviceInfo] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<FeedbackReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [historyReports, setHistoryReports] = useState<FeedbackReport[]>([]);

  // Update category when switching tabs
  useEffect(() => {
    if (activeTab === 'BUG') {
      setCategory(BUG_CATEGORIES[0].label);
    } else if (activeTab === 'FEATURE') {
      setCategory(FEATURE_CATEGORIES[0].label);
    } else if (activeTab === 'HISTORY') {
      setHistoryReports(feedbackService.getLocalReports());
    }
  }, [activeTab]);

  useEffect(() => {
    if (currentUserName) {
      setSenderName(currentUserName);
    }
  }, [currentUserName]);

  if (!isOpen) return null;

  const currentDeviceInfo = `${navigator.userAgent.includes('Mobile') ? '📱 HP/Mobile' : '💻 Desktop'} · Layar: ${
    window.innerWidth
  }x${window.innerHeight} · ${navigator.userAgent.slice(0, 80)}...`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      soundManager.playBoing();
      return;
    }

    setIsSubmitting(true);

    const reportData = {
      type: activeTab === 'FEATURE' ? ('FEATURE' as const) : ('BUG' as const),
      title: title.trim(),
      category,
      description: description.trim(),
      senderName: senderName.trim() || 'Warga Anonim',
      priority,
      deviceInfo: includeDeviceInfo ? currentDeviceInfo : undefined,
      gameStateInfo: {
        round: roundCount,
        activePlayer: currentUserName,
        isOnline: !!multiplayerRoomCode,
        roomCode: multiplayerRoomCode,
      },
    };

    const res = await feedbackService.submitFeedback(reportData);

    setIsSubmitting(false);
    setIsSuccess(true);
    setSubmittedReport(res.report);
    soundManager.playFanfare();

    // Reset form fields
    setTitle('');
    setDescription('');
    setHistoryReports(feedbackService.getLocalReports());
  };

  const handleCopyReport = (report: FeedbackReport) => {
    const text = feedbackService.generateShareableText(report);
    navigator.clipboard.writeText(text);
    setCopied(true);
    soundManager.playBoing();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-amber-50 rounded-2xl comic-box-lg max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-4 text-white flex items-center justify-between border-b-4 border-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 border-2 border-slate-950 flex items-center justify-center text-xl shadow-xs text-slate-950">
              📮
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-yellow-400 text-slate-950 font-bold px-2 py-0.5 rounded font-comic uppercase tracking-wider">
                  Balai Aspirasi Warga
                </span>
                <span className="text-[10px] text-amber-200 hidden sm:inline">RT 04 / RW 62</span>
              </div>
              <h2 className="text-base sm:text-lg font-black font-comic leading-tight mt-0.5">
                Lapor Bug & Usulan Fitur
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            title="Tutup Form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b-2 border-slate-900 bg-amber-100/90 p-1.5 gap-1.5">
          <button
            onClick={() => {
              setActiveTab('BUG');
              setIsSuccess(false);
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-bold font-comic text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'BUG'
                ? 'bg-rose-600 text-white shadow-xs border-2 border-slate-900 scale-102'
                : 'text-slate-700 hover:bg-amber-200'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Lapor Bug / Eror</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('FEATURE');
              setIsSuccess(false);
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-bold font-comic text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'FEATURE'
                ? 'bg-amber-500 text-slate-950 shadow-xs border-2 border-slate-900 scale-102'
                : 'text-slate-700 hover:bg-amber-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Masukkan & Usulan</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('HISTORY');
              setIsSuccess(false);
            }}
            className={`py-2 px-3 rounded-xl font-bold font-comic text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-slate-900 text-yellow-300 shadow-xs border-2 border-slate-900'
                : 'text-slate-700 hover:bg-amber-200'
            }`}
            title="Riwayat Laporan Saya"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Riwayat</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* SUCCESS BANNER OVERLAY */}
          {isSuccess && submittedReport && (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-comic font-black text-emerald-950 text-sm">
                    Laporan Berhasil Dicatat di Balai Warga!
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    Terima kasih <b>{submittedReport.senderName}</b>!{' '}
                    {submittedReport.type === 'BUG'
                      ? 'Laporan bug Anda sudah disimpan dan dikirim ke server developer untuk segera diperbaiki.'
                      : 'Usulan fitur keren Anda sudah masuk daftar pertimbangan pembaruan desa berikutnya.'}
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-white/90 rounded-xl border border-emerald-300 text-xs text-slate-800 space-y-1">
                <div className="flex justify-between font-bold text-[11px] text-slate-600 border-b border-slate-200 pb-1">
                  <span>ID Laporan: {submittedReport.id}</span>
                  <span className="text-emerald-700 uppercase font-mono">Status: TERCATAT</span>
                </div>
                <p className="font-bold text-slate-900 truncate">"{submittedReport.title}"</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => handleCopyReport(submittedReport)}
                  className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tersalin di Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Format Laporan (WA/Discord)</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-comic cursor-pointer shadow-2xs"
                >
                  Kirim Aduan Lain
                </button>
              </div>
            </div>
          )}

          {/* TAB 1 & 2: FORM SUBMISSION */}
          {(activeTab === 'BUG' || activeTab === 'FEATURE') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Info banner */}
              <div
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                  activeTab === 'BUG'
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-amber-100/70 border-amber-300 text-amber-950'
                }`}
              >
                {activeTab === 'BUG' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <MessageSquareHeart className="w-4 h-4 text-amber-700 shrink-0" />
                )}
                <p className="leading-snug">
                  {activeTab === 'BUG'
                    ? 'Menemukan tombol eror, dadu macet, atau tampilan rusak? Beritahu kami agar langsung diperbaiki!'
                    : 'Punya ide petak baru, profesi kocak, atau aturan main seru? Tulis ide Anda di bawah ini!'}
                </p>
              </div>

              {/* Row 1: Sender Name & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 font-comic mb-1">
                    Nama / Panggilan Anda
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Contoh: Budi Santoso / Pak RT"
                    maxLength={40}
                    className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 font-comic mb-1">
                    {activeTab === 'BUG' ? 'Tingkat Keparahan Bug' : 'Prioritas Usulan'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPriority('LOW')}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        priority === 'LOW'
                          ? 'bg-emerald-600 text-white border-slate-900 shadow-2xs font-comic'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ☕ Santai
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('NORMAL')}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        priority === 'NORMAL'
                          ? 'bg-amber-500 text-slate-950 border-slate-900 shadow-2xs font-comic'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ⚠️ Sedang
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('HIGH')}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        priority === 'HIGH'
                          ? 'bg-rose-600 text-white border-slate-900 shadow-2xs font-comic animate-pulse'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      🚨 Kritis
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 font-comic mb-1">
                  Kategori {activeTab === 'BUG' ? 'Kendala' : 'Fitur'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  {(activeTab === 'BUG' ? BUG_CATEGORIES : FEATURE_CATEGORIES).map((cat) => (
                    <option key={cat.id} value={cat.label}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 3: Title */}
              <div>
                <label className="block text-xs font-bold text-slate-800 font-comic mb-1">
                  Judul Singkat <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    activeTab === 'BUG'
                      ? 'Contoh: Dadu tidak muter waktu mabar online berdua'
                      : 'Contoh: Tambah Petak IKN Nusantara & Proyek Kereta Cepat'
                  }
                  maxLength={120}
                  className="w-full px-3 py-2.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Row 4: Detailed Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 font-comic">
                    Rincian Cerita / Kronologi <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {description.length}/1500 karakter
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    activeTab === 'BUG'
                      ? 'Jelaskan kronologinya: waktu langkah ke berapa, apa yang diklik, apa yang muncul di layar, atau browser yang dipakai...'
                      : 'Jelaskan ide fiturnya: bagaimana cara kerjanya, efeknya bagi pemain apa, dan kenapa fitur ini bakal seru banget dimainkan...'
                  }
                  maxLength={1500}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none font-sans"
                />
              </div>

              {/* Device and Game State Info Checkbox */}
              <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-300 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={includeDeviceInfo}
                    onChange={(e) => setIncludeDeviceInfo(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500"
                  />
                  <span>Sertakan info teknis game otomatis untuk bantu developer</span>
                </label>
                {includeDeviceInfo && (
                  <p className="text-[10px] text-slate-500 font-mono pl-6 leading-tight">
                    {currentDeviceInfo} {roundCount ? `· Putaran: ${roundCount}` : ''}{' '}
                    {multiplayerRoomCode ? `· Room: ${multiplayerRoomCode}` : ''}
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  className={`flex-1 py-3 px-4 rounded-xl font-black font-comic text-xs uppercase tracking-wider comic-box-sm comic-btn-hover flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    title.trim() && description.trim() && !isSubmitting
                      ? activeTab === 'BUG'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Send className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>
                    {isSubmitting
                      ? 'Mengirim Laporan...'
                      : activeTab === 'BUG'
                      ? 'Kirim Laporan Bug'
                      : 'Kirim Usulan Fitur'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold font-comic text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: REPORT HISTORY */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <h4 className="font-comic font-black text-xs text-slate-900 uppercase tracking-wider">
                  Daftar Pengaduan yang Pernah Dikirim ({historyReports.length})
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">Tersimpan di Balai Warga</span>
              </div>

              {historyReports.length === 0 ? (
                <div className="text-center py-8 space-y-2 bg-amber-50/60 rounded-xl border border-dashed border-amber-300 p-4">
                  <div className="text-3xl">📭</div>
                  <p className="font-bold font-comic text-xs text-slate-700">Belum ada aduan yang dikirim</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Jika Anda menemukan bug atau punya ide fitur baru, silakan gunakan tab "Lapor Bug" atau "Masukkan & Usulan".
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {historyReports.map((report) => {
                    const isBug = report.type === 'BUG';
                    return (
                      <div
                        key={report.id}
                        className={`p-3 rounded-xl border-2 transition-all space-y-1.5 ${
                          isBug ? 'bg-rose-50/70 border-rose-200' : 'bg-amber-50/70 border-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.2 rounded font-mono ${
                                isBug ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'
                              }`}
                            >
                              {isBug ? 'BUG' : 'FITUR'}
                            </span>
                            <span className="text-[11px] font-bold text-slate-800 font-comic">
                              {report.category}
                            </span>
                          </div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded font-mono border border-emerald-300 shrink-0">
                            TERCATAT
                          </span>
                        </div>

                        <h5 className="font-bold text-xs text-slate-950 font-comic leading-tight">
                          {report.title}
                        </h5>

                        <p className="text-[11px] text-slate-700 line-clamp-3 bg-white/70 p-2 rounded-lg border border-slate-200/60">
                          {report.description}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-200">
                          <span>
                            Oleh: <b>{report.senderName}</b> · {new Date(report.createdAt).toLocaleDateString('id-ID')}
                          </span>
                          <button
                            onClick={() => handleCopyReport(report)}
                            className="text-slate-700 hover:text-slate-950 font-bold underline flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Salin</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
