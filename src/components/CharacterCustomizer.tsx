import React, { useState } from 'react';
import { Player, CharacterPreset } from '../types/game';
import { CHARACTER_PRESETS, ACCESSORIES_OPTIONS } from '../data/characters';
import { soundManager } from '../utils/audio';
import { Users, Bot, Sparkles, Play, Shield, RefreshCw } from 'lucide-react';
import simulatorWniBanner from '../assets/images/simulator_wni_banner_1791190534170.jpg';

interface CharacterCustomizerProps {
  onStartGame: (players: Player[]) => void;
}

export const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({
  onStartGame
}) => {
  const [mode, setMode] = useState<'SINGLE_BOT' | 'MULTIPLAYER'>('SINGLE_BOT');
  const [playerCount, setPlayerCount] = useState<number>(3);

  // Player custom states for up to 4 players
  const [customPlayers, setCustomPlayers] = useState<{
    name: string;
    presetId: string;
    accessory: string;
    quote: string;
    color: string;
    isBot: boolean;
  }[]>([
    {
      name: 'Pak Bambang Safari',
      presetId: 'pejabat',
      accessory: 'Peci Hitam & Pin Emas',
      quote: 'Tenang, semua SPJ sudah saya rapikan dan cap basah!',
      color: '#0284c7',
      isBot: false,
    },
    {
      name: 'Bu Tejo Gaspol',
      presetId: 'emak_matic',
      accessory: 'Daster Batik & Rol Rambut',
      quote: 'Lampu sen kiri ya bebas belok kanan dong!',
      color: '#e11d48',
      isBot: true,
    },
    {
      name: 'Alvin SCBD',
      presetId: 'anak_jaksel',
      accessory: 'AirPods & Tumbler Kopi',
      quote: 'Which is literally financial freedom, bestie!',
      color: '#8b5cf6',
      isBot: true,
    },
    {
      name: 'Koh Andre Cuan',
      presetId: 'bos_pinjol',
      accessory: 'Gelang Emas 24 Karat & Jam Rolex KW',
      quote: 'Cair 3 menit tanpa jaminan ya!',
      color: '#eab308',
      isBot: true,
    },
  ]);

  const [activeEditingIdx, setActiveEditingIdx] = useState(0);

  const handleSelectPreset = (idx: number, preset: CharacterPreset) => {
    setCustomPlayers((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        name: preset.name,
        presetId: preset.id,
        accessory: preset.accessory,
        quote: preset.quote,
        color: preset.color,
      };
      return next;
    });
  };

  const handleStart = () => {
    soundManager.playFanfare();
    soundManager.startBGM();

    const initialPlayers: Player[] = [];
    for (let i = 0; i < playerCount; i++) {
      const cp = customPlayers[i];
      const preset = CHARACTER_PRESETS.find((p) => p.id === cp.presetId) || CHARACTER_PRESETS[0];

      initialPlayers.push({
        id: `player_${i + 1}`,
        name: cp.name.trim() || `Warga ${i + 1}`,
        characterId: cp.presetId,
        isBot: mode === 'SINGLE_BOT' ? i !== 0 : false,
        avatarEmoji: preset.avatarEmoji,
        accessory: cp.accessory,
        color: cp.color,
        quote: cp.quote,
        position: 0,
        money: cp.presetId === 'bos_pinjol' ? 25000000 : 20000000, // Rp 20 Jt initial capital
        karma: 0,
        inJail: false,
        jailTurns: 0,
        totalBribes: 0,
        totalTaxesPaid: 0,
        sabotagesRemaining: 3,
        isBankrupt: false,
      });
    }

    onStartGame(initialPlayers);
  };

  const currentEditing = customPlayers[activeEditingIdx];
  const activePreset = CHARACTER_PRESETS.find((p) => p.id === currentEditing?.presetId) || CHARACTER_PRESETS[0];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Title & Cover Hero */}
      <div className="bg-amber-100 rounded-3xl comic-box-lg p-5 sm:p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:w-1/2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🇮🇩</span>
            <span className="text-xs uppercase tracking-widest font-black text-red-600 bg-red-100 px-2 py-0.5 rounded border border-red-300">
              Simulasi Kehidupan Nyata
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-comic text-slate-900 leading-tight">
            SIMULATOR WNI
          </h1>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            Selamat datang di game monopoli satir kehidupan Indonesia! Bangun kerajaan properti dari lapak kaki lima sampai megaproyek IKN, lobi proyek bawah meja, awasi meteran Karma KPK, dan menang arisan RT!
          </p>
        </div>

        <div className="w-full md:w-1/2 rounded-2xl overflow-hidden comic-box shadow-lg">
          <img
            src={simulatorWniBanner}
            alt="Simulator WNI Game Banner"
            referrerPolicy="no-referrer"
            className="w-full h-48 object-cover"
          />
        </div>
      </div>

      {/* Mode & Player Count Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Game Mode */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl comic-box space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            1. Pilih Mode Permainan:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                setMode('SINGLE_BOT');
                soundManager.playBoing();
              }}
              className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                mode === 'SINGLE_BOT'
                  ? 'bg-amber-100 border-slate-900 shadow-md ring-2 ring-amber-400'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-400'
              }`}
            >
              <Bot className="w-5 h-5 text-blue-600 mb-1" />
              <p className="font-bold text-xs text-slate-900 font-comic">Solo vs Bot Lokal</p>
              <p className="text-[10px] text-slate-500">Lawan 2-3 warga AI satir (Pak RT, Bu Tejo, dll)</p>
            </button>

            <button
              onClick={() => {
                setMode('MULTIPLAYER');
                soundManager.playBoing();
              }}
              className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                mode === 'MULTIPLAYER'
                  ? 'bg-amber-100 border-slate-900 shadow-md ring-2 ring-amber-400'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-400'
              }`}
            >
              <Users className="w-5 h-5 text-emerald-600 mb-1" />
              <p className="font-bold text-xs text-slate-900 font-comic">Multipemain (Pass & Play)</p>
              <p className="text-[10px] text-slate-500">Main bareng teman di 1 layar, saling sabotase!</p>
            </button>
          </div>
        </div>

        {/* Player Count */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl comic-box space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            2. Jumlah Warga yang Bertanding:
          </label>
          <div className="flex gap-2">
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => {
                  setPlayerCount(count);
                  soundManager.playBoing();
                }}
                className={`flex-1 py-3 text-sm font-black font-comic rounded-xl border-2 transition-all cursor-pointer ${
                  playerCount === count
                    ? 'bg-amber-400 border-slate-900 shadow-md text-slate-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {count} Warga
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 italic">
            {mode === 'SINGLE_BOT'
              ? `Anda akan bertanding melawan ${playerCount - 1} Bot Warga Lokal.`
              : `${playerCount} pemain manusia akan bergantian giliran di layar ini.`}
          </p>
        </div>
      </div>

      {/* Character Customization Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl comic-box space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
            3. Kustomisasi Karakter Warga:
          </label>
          <div className="flex gap-1.5">
            {Array.from({ length: playerCount }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveEditingIdx(idx)}
                className={`py-1 px-3 text-xs font-bold rounded-lg border-2 transition-all cursor-pointer ${
                  activeEditingIdx === idx
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Warga #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Character Archetype Picker */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700">Pilih Tokoh Komikal Indonesia:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {CHARACTER_PRESETS.map((preset) => {
              const isSelected = currentEditing?.presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(activeEditingIdx, preset)}
                  className={`p-2.5 rounded-xl border-2 text-center transition-all flex flex-col items-center cursor-pointer ${
                    isSelected
                      ? 'bg-amber-100 border-slate-900 ring-2 ring-amber-400 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-3xl mb-1">{preset.avatarEmoji}</span>
                  <span className="text-xs font-bold font-comic text-slate-900 line-clamp-1">{preset.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">{preset.role}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Selected Archetype Details & Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50 p-4 rounded-xl border border-amber-300">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nama Warga / Alias:
              </label>
              <input
                type="text"
                value={currentEditing?.name || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomPlayers((prev) => {
                    const next = [...prev];
                    next[activeEditingIdx].name = val;
                    return next;
                  });
                }}
                className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Pilih Aksesoris Khas:
              </label>
              <select
                value={currentEditing?.accessory || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomPlayers((prev) => {
                    const next = [...prev];
                    next[activeEditingIdx].accessory = val;
                    return next;
                  });
                }}
                className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
              >
                {ACCESSORIES_OPTIONS.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Slogan / Moto Hidup Satir:
              </label>
              <input
                type="text"
                value={currentEditing?.quote || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomPlayers((prev) => {
                    const next = [...prev];
                    next[activeEditingIdx].quote = val;
                    return next;
                  });
                }}
                className="w-full p-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-medium text-slate-800 italic focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-300 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full border-2 border-slate-900 flex items-center justify-center text-3xl shadow-sm"
                  style={{ backgroundColor: currentEditing?.color || '#0284c7' }}
                >
                  {activePreset.avatarEmoji}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-comic">{currentEditing?.name}</h4>
                  <p className="text-xs text-rose-600 font-semibold">{currentEditing?.accessory}</p>
                </div>
              </div>

              <div className="p-2.5 bg-amber-100/70 rounded-lg text-xs space-y-1">
                <span className="font-bold text-amber-900 block">✨ Keahlian Khusus (Perk):</span>
                <p className="text-slate-700">{activePreset.perkDescription}</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 italic mt-3">
              "{currentEditing?.quote}"
            </p>
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 px-6 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-base font-comic uppercase tracking-wider rounded-2xl comic-box comic-btn-hover flex items-center justify-center gap-3 shadow-lg cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          Mulai Permainan Simulator WNI!
        </button>
      </div>
    </div>
  );
};
