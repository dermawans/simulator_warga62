import React, { useState, useEffect } from 'react';
import {
  saveGameToCloud,
  loadGameFromCloud,
  listLocalSaves,
  deleteLocalSave,
  GameSaveData,
} from '../utils/supabase';
import { Player, BoardTile } from '../types/game';
import { soundManager } from '../utils/audio';
import { formatRupiah } from '../utils/formatters';
import {
  Cloud,
  Save,
  Download,
  X,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: {
    players: Player[];
    tiles: BoardTile[];
    roundCount: number;
    activePlayerIndex: number;
    arisanPot: number;
    economicIndex: number;
    economicTurnCountdown: number;
  };
  onLoadGame: (data: GameSaveData) => void;
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onLoadGame,
}) => {
  const [activeTab, setActiveTab] = useState<'SAVE' | 'LOAD'>('SAVE');

  // Save tab states
  const [saveCode, setSaveCode] = useState<string>(() => generateRandomCode());
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Load tab states
  const [loadInputCode, setLoadInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadMessage, setLoadMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [localSavesList, setLocalSavesList] = useState<GameSaveData[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalSavesList(listLocalSaves());
      setSaveMessage(null);
      setLoadMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function generateRandomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'WARGA-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Handle Save
  const handleSaveGame = async () => {
    if (!saveCode.trim()) return;
    setIsSaving(true);
    setSaveMessage(null);

    const result = await saveGameToCloud(saveCode, {
      game_name: 'Simulator Warga62',
      round_count: gameState.roundCount,
      current_player_index: gameState.activePlayerIndex,
      players: gameState.players,
      tiles: gameState.tiles,
      arisan_pot: gameState.arisanPot,
      economic_index: gameState.economicIndex,
      economic_turn_countdown: gameState.economicTurnCountdown,
    });

    setIsSaving(false);
    setLocalSavesList(listLocalSaves());

    if (result.success) {
      soundManager.playMoney();
      setSaveMessage({ text: result.message, isError: false });
    } else {
      setSaveMessage({ text: result.message, isError: true });
    }
  };

  // Handle Load
  const handleLoadGame = async (codeToLoad: string) => {
    if (!codeToLoad.trim()) return;
    setIsLoading(true);
    setLoadMessage(null);

    const result = await loadGameFromCloud(codeToLoad);
    setIsLoading(false);

    if (result.success && result.data) {
      soundManager.playFanfare();
      onLoadGame(result.data);
      onClose();
    } else {
      soundManager.playGavel();
      setLoadMessage({ text: result.message, isError: true });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 select-none">
      <div className="bg-[#fffdf7] max-w-lg w-full rounded-3xl border-4 border-slate-900 comic-box shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-4 border-b-3 border-slate-900 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Cloud className="w-6 h-6 text-yellow-300" />
            <div>
              <h2 className="text-xl font-black font-comic tracking-wide leading-tight">
                Simpan & Lanjut Game
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                Simulator Warga62 · Cloud & Cadangan Perangkat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector (Clean, 2 tabs only) */}
        <div className="flex border-b-2 border-slate-900 bg-amber-100/60 p-1.5 gap-1.5 text-xs font-bold font-comic">
          <button
            onClick={() => setActiveTab('SAVE')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'SAVE'
                ? 'bg-emerald-600 text-white border-2 border-slate-900 shadow-xs'
                : 'text-slate-700 hover:bg-amber-200/50'
            }`}
          >
            <Save className="w-4 h-4" />
            Simpan Game
          </button>
          <button
            onClick={() => setActiveTab('LOAD')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'LOAD'
                ? 'bg-amber-500 text-slate-950 border-2 border-slate-900 shadow-xs'
                : 'text-slate-700 hover:bg-amber-200/50'
            }`}
          >
            <Download className="w-4 h-4" />
            Lanjut Permainan
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-slate-900 text-xs">
          {/* TAB 1: SAVE GAME */}
          {activeTab === 'SAVE' && (
            <div className="space-y-4">
              {/* Game Status Snapshot Card */}
              <div className="bg-amber-50 rounded-2xl border-2 border-slate-900 p-3 space-y-2">
                <p className="text-[11px] font-black font-comic text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                  Status Permainan yang Akan Disimpan:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-300">
                    <p className="text-[10px] text-slate-500">Putaran Saat Ini:</p>
                    <p className="font-black font-comic text-slate-900 text-sm">
                      Putaran {gameState.roundCount}/30
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-300">
                    <p className="text-[10px] text-slate-500">Jumlah Warga:</p>
                    <p className="font-black font-comic text-slate-900 text-sm">
                      {gameState.players.filter((p) => !p.isBankrupt).length} Warga Aktif
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-300 col-span-2 sm:col-span-1">
                    <p className="text-[10px] text-slate-500">Kas Arisan RT:</p>
                    <p className="font-mono font-bold text-emerald-800 text-xs">
                      {formatRupiah(gameState.arisanPot)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Code Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Kode Simpan (Save Code):</span>
                  <button
                    onClick={() => setSaveCode(generateRandomCode())}
                    className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Acak Kode Baru
                  </button>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={saveCode}
                    onChange={(e) => setSaveCode(e.target.value.toUpperCase())}
                    className="flex-1 font-mono font-black text-sm uppercase px-3 py-2 rounded-xl border-2 border-slate-900 bg-white tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="MISAL: WARGA-1234"
                  />
                  <button
                    onClick={() => copyToClipboard(saveCode)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 border-2 border-slate-900 rounded-xl flex items-center gap-1 font-bold cursor-pointer"
                    title="Salin Kode"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Gunakan kode unik ini untuk melanjutkan permainan di perangkat mana saja kapan pun Anda mau.
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={handleSaveGame}
                disabled={isSaving || !saveCode.trim()}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-black font-comic text-sm uppercase tracking-wider rounded-2xl border-3 border-slate-900 comic-box-sm cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyimpan Progres...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-yellow-300" />
                    Simpan Progres Permainan
                  </>
                )}
              </button>

              {/* Feedback Alert */}
              {saveMessage && (
                <div
                  className={`p-3 rounded-xl border-2 border-slate-900 flex items-start gap-2 ${
                    saveMessage.isError ? 'bg-rose-100 text-rose-900' : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {saveMessage.isError ? (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  )}
                  <p className="text-[11px] font-bold leading-relaxed">{saveMessage.text}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOAD GAME */}
          {activeTab === 'LOAD' && (
            <div className="space-y-4">
              {/* Load Input Form */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">
                  Masukkan Kode Simpan (Save Code):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={loadInputCode}
                    onChange={(e) => setLoadInputCode(e.target.value.toUpperCase())}
                    className="flex-1 font-mono font-black text-sm uppercase px-3 py-2 rounded-xl border-2 border-slate-900 bg-white tracking-widest focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="MISAL: WARGA-1234"
                  />
                  <button
                    onClick={() => handleLoadGame(loadInputCode)}
                    disabled={isLoading || !loadInputCode.trim()}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-500 border-2 border-slate-900 rounded-xl font-black font-comic text-xs uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Lanjut
                      </>
                    )}
                  </button>
                </div>
              </div>

              {loadMessage && (
                <div
                  className={`p-3 rounded-xl border-2 border-slate-900 flex items-start gap-2 ${
                    loadMessage.isError ? 'bg-rose-100 text-rose-900' : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <p className="text-[11px] font-bold leading-relaxed">{loadMessage.text}</p>
                </div>
              )}

              {/* Recent Saves List */}
              <div className="space-y-2 pt-2 border-t-2 border-dashed border-slate-300">
                <p className="font-bold font-comic text-slate-700 flex items-center justify-between">
                  <span>Daftar Simpanan Terbaru di Perangkat Ini:</span>
                  <span className="text-[10px] text-slate-500">{localSavesList.length} Tersimpan</span>
                </p>

                {localSavesList.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 italic bg-amber-50 rounded-2xl border border-slate-300">
                    Belum ada riwayat permainan yang disimpan di perangkat ini.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {localSavesList.map((item) => (
                      <div
                        key={item.save_code}
                        className="bg-white p-2.5 rounded-xl border-2 border-slate-900 flex items-center justify-between gap-2 shadow-xs hover:border-emerald-600 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs text-slate-950 uppercase bg-amber-200 px-1.5 py-0.5 rounded">
                              {item.save_code}
                            </span>
                            <span className="text-[11px] font-bold text-slate-600">
                              Putaran {item.round_count}/30 · {item.players.length} Warga
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {item.saved_at ? new Date(item.saved_at).toLocaleString('id-ID') : 'Baru saja'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleLoadGame(item.save_code)}
                            className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Lanjut
                          </button>
                          <button
                            onClick={() => {
                              deleteLocalSave(item.save_code);
                              setLocalSavesList(listLocalSaves());
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                            title="Hapus Simpanan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-amber-100/50 border-t-2 border-slate-900 flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <span>Simulator Warga62 Cloud Save</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
