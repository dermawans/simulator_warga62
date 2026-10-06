import React, { useRef } from 'react';
import { Player } from '../types/game';
import { formatRupiah } from '../utils/formatters';
import { X, Download, Share2, Copy, Check } from 'lucide-react';

interface ViralNewsData {
  type: 'BUSTED_KPK' | 'WON_ARISAN' | 'BANKRUPT_PINJOL' | 'BECOME_SULTAN';
  headline: string;
  subheadline: string;
  story: string;
  quoteWarga: string;
  fineAmount?: number;
}

interface ViralNewsModalProps {
  player: Player;
  news: ViralNewsData;
  onClose: () => void;
}

export const ViralNewsModal: React.FC<ViralNewsModalProps> = ({
  player,
  news,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const getShareText = () => {
    return `🚨 [BREAKING NEWS SIMULATOR WNI] 🚨\n\n"${news.headline}"\n\nPelaku: ${player.name} (${player.avatarEmoji})\nStatus: ${news.subheadline}\nKata Warga: "${news.quoteWarga}"\n\nMainkan Simulator WNI: Game Monopoli Satir Kehidupan Nyata Indonesia!`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWA = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw comic newspaper card
    canvas.width = 800;
    canvas.height = 700;

    // Background paper
    ctx.fillStyle = '#fef3c7'; // warm amber paper
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Masthead header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, 20, canvas.width - 40, 80);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📰 KORAN WARGA NUSANTARA 📰', canvas.width / 2, 72);

    // Date line
    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Edisi Khusus Investigasi Warga · Terbit Hari Ini', canvas.width / 2, 130);

    // Headline
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';

    // Wrap headline
    const words = news.headline.split(' ');
    let line1 = '';
    let line2 = '';
    for (const w of words) {
      if ((line1 + w).length < 34) {
        line1 += w + ' ';
      } else {
        line2 += w + ' ';
      }
    }
    ctx.fillText(line1, canvas.width / 2, 185);
    if (line2) {
      ctx.fillText(line2, canvas.width / 2, 225);
    }

    // Caricature photo box
    const photoY = line2 ? 260 : 230;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(240, photoY, 320, 190);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(240, photoY, 320, 190);

    // Emoji avatar in photo box
    ctx.font = '72px sans-serif';
    ctx.fillText(player.avatarEmoji, canvas.width / 2, photoY + 95);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(player.name, canvas.width / 2, photoY + 140);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.fillText(`Aksesoris: ${player.accessory}`, canvas.width / 2, photoY + 168);

    // Story prose
    const storyY = photoY + 225;
    ctx.fillStyle = '#334155';
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.fillText(`"${news.story}"`, canvas.width / 2, storyY);

    // Quote box
    ctx.fillStyle = '#fee2e2';
    ctx.fillRect(60, storyY + 30, canvas.width - 120, 70);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, storyY + 30, canvas.width - 120, 70);

    ctx.fillStyle = '#991b1b';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText(`Saksi Mata Warga: "${news.quoteWarga}"`, canvas.width / 2, storyY + 70);

    // Watermark footer
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Game Simulator WNI · Monopoli Satir Kehidupan Nyata', canvas.width / 2, canvas.height - 40);

    // Trigger download
    const link = document.createElement('a');
    link.download = `berita-viral-wni-${player.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Hidden canvas for PNG export */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-[#fef9c3] rounded-2xl comic-box-lg max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 border-4 border-slate-900">
        {/* Newspaper Top Bar */}
        <div className="bg-slate-900 text-yellow-300 p-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📰</span>
            <span className="font-comic font-bold tracking-widest text-sm uppercase">KORAN WARGA NUSANTARA</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-800 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Newspaper Body */}
        <div className="p-6 space-y-4">
          <div className="text-center border-b-2 border-slate-800 pb-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              EDISI KHUSUS INVESTIGASI WARGA · HARI INI
            </p>
            <h2 className="text-xl sm:text-2xl font-black font-comic text-red-700 leading-tight mt-1">
              {news.headline}
            </h2>
            <p className="text-xs font-bold text-slate-700 mt-1 uppercase">
              {news.subheadline}
            </p>
          </div>

          {/* Photo & Character Box */}
          <div className="bg-white p-4 rounded-xl border-2 border-slate-900 text-center shadow-inner">
            <div className="w-20 h-20 bg-amber-100 rounded-full border-2 border-slate-900 flex items-center justify-center text-4xl mx-auto mb-2 shadow-sm">
              {player.avatarEmoji}
            </div>
            <p className="font-bold text-slate-900 font-comic text-base">{player.name}</p>
            <p className="text-xs text-rose-600 font-semibold">{player.accessory}</p>
            {news.fineAmount && (
              <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                Kerugian / Sitaan: {formatRupiah(news.fineAmount)}
              </p>
            )}
          </div>

          {/* Story & Quote */}
          <p className="text-xs text-slate-700 leading-relaxed font-medium italic">
            "{news.story}"
          </p>

          <div className="p-3 bg-red-50 rounded-xl border border-red-300">
            <p className="text-[11px] font-bold text-red-800 uppercase tracking-wide">
              Kesaksian Warga Sekitar:
            </p>
            <p className="text-xs font-serif text-slate-800 italic mt-0.5">
              "{news.quoteWarga}"
            </p>
          </div>

          {/* Share Action Buttons */}
          <div className="pt-2 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 text-center">
              Bagikan Momen Kocak ke Media Sosial:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleShareWA}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold comic-box-sm comic-btn-hover flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                WhatsApp
              </button>
              <button
                onClick={handleShareTwitter}
                className="py-2.5 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold comic-box-sm comic-btn-hover flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                X / Twitter
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Berita Disalin!' : 'Salin Teks Berita'}
              </button>
              <button
                onClick={handleDownloadImage}
                className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-yellow-300 rounded-xl text-xs font-bold comic-box-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Koran
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
