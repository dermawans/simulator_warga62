import React, { useState, useEffect, useRef } from 'react';
import { multiplayerService } from '../services/multiplayer';
import { RoomState, RoomPlayer } from '../types/multiplayer';
import { CHARACTER_PRESETS } from '../data/characters';
import { soundManager } from '../utils/audio';
import {
  Globe,
  Users,
  Copy,
  Check,
  Play,
  X,
  Sparkles,
  Crown,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  LogOut,
  MessageSquare,
} from 'lucide-react';

interface OnlineLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMultiplayerGame: (room: RoomState, initialPlayers: any[]) => void;
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  isOpen,
  onClose,
  onStartMultiplayerGame,
}) => {
  // Mode: JOIN_OR_CREATE vs IN_LOBBY
  const [viewState, setViewState] = useState<'SETUP' | 'LOBBY'>('SETUP');
  const [activeTab, setActiveTab] = useState<'CREATE' | 'JOIN'>('CREATE');

  // Player profile configuration
  const [playerName, setPlayerName] = useState('Warga Santuy');
  const [selectedPresetId, setSelectedPresetId] = useState('pejabat');
  const [selectedColor, setSelectedColor] = useState('#0284c7');

  // Room parameters
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [currentRoom, setCurrentRoom] = useState<RoomState | null>(null);

  // Status & notifications
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Quick Lobby Chat
  const [chatInput, setChatInput] = useState('');
  const [lobbyChat, setLobbyChat] = useState<{ sender: string; text: string; color: string }[]>([]);
  const connectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Subscribe to multiplayer service events
    const unsubRoom = multiplayerService.onRoomUpdate((room) => {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      setCurrentRoom(room);
      setViewState('LOBBY');
      setIsConnecting(false);
      setErrorMessage(null);
    });

    const unsubStart = multiplayerService.onGameStart((room, initialGameState) => {
      soundManager.playFanfare();
      onStartMultiplayerGame(room, room.players);
      onClose();
    });

    const unsubError = multiplayerService.onError((msg) => {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      setErrorMessage(msg);
      setIsConnecting(false);
      soundManager.playGavel();
    });

    const unsubChat = multiplayerService.onChatMessage((msg) => {
      setLobbyChat((prev) => [
        ...prev.slice(-15),
        { sender: msg.senderName, text: msg.text, color: msg.senderColor },
      ]);
      soundManager.playHop();
    });

    return () => {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
      }
      unsubRoom();
      unsubStart();
      unsubError();
      unsubChat();
    };
  }, [isOpen, onStartMultiplayerGame, onClose]);

  if (!isOpen) return null;

  const activePreset = CHARACTER_PRESETS.find((p) => p.id === selectedPresetId) || CHARACTER_PRESETS[0];

  function generateRandomRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'WARGA-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create Room
  const handleCreateRoom = () => {
    if (!playerName.trim()) return;
    setIsConnecting(true);
    setErrorMessage(null);

    if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
    connectTimeoutRef.current = window.setTimeout(() => {
      setIsConnecting(false);
      setErrorMessage('Waktu koneksi habis. Server WebSocket/Supabase belum merespons. Anda dapat mencoba "Mode Lobi Simulasi" di bawah.');
    }, 7000);

    const newCode = generateRandomRoomCode();
    const myPlayer: RoomPlayer = {
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: playerName.trim(),
      characterId: activePreset.id,
      avatarEmoji: activePreset.avatarEmoji,
      color: selectedColor,
      accessory: activePreset.accessory,
      quote: activePreset.quote,
      isHost: true,
      isReady: true,
      connected: true,
    };

    multiplayerService.joinRoom(newCode, myPlayer, maxPlayers);
  };

  // Create Simulation Room (instant local test)
  const handleCreateSimulationRoom = () => {
    if (!playerName.trim()) return;
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    setIsConnecting(false);
    setErrorMessage(null);

    const newCode = generateRandomRoomCode();
    const myPlayer: RoomPlayer = {
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: playerName.trim(),
      characterId: activePreset.id,
      avatarEmoji: activePreset.avatarEmoji,
      color: selectedColor,
      accessory: activePreset.accessory,
      quote: activePreset.quote,
      isHost: true,
      isReady: true,
      connected: true,
    };

    multiplayerService.initSimulationRoom(newCode, myPlayer, maxPlayers);
  };

  // Join Room
  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomCodeInput.trim()) return;
    setIsConnecting(true);
    setErrorMessage(null);

    if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
    connectTimeoutRef.current = window.setTimeout(() => {
      setIsConnecting(false);
      setErrorMessage('Waktu koneksi habis saat mencari room. Pastikan kode room sudah benar.');
    }, 7000);

    const cleanCode = roomCodeInput.trim().toUpperCase();
    const myPlayer: RoomPlayer = {
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: playerName.trim(),
      characterId: activePreset.id,
      avatarEmoji: activePreset.avatarEmoji,
      color: selectedColor,
      accessory: activePreset.accessory,
      quote: activePreset.quote,
      isHost: false,
      isReady: false,
      connected: true,
    };

    multiplayerService.joinRoom(cleanCode, myPlayer);
  };

  // Toggle Ready
  const handleToggleReady = () => {
    multiplayerService.toggleReady();
    soundManager.playBoing();
  };

  // Host starts the game
  const handleStartGame = () => {
    if (!currentRoom) return;
    multiplayerService.startGame({});
  };

  // Leave room
  const handleLeaveRoom = () => {
    multiplayerService.disconnect();
    setCurrentRoom(null);
    setViewState('SETUP');
    setLobbyChat([]);
  };

  // Send lobby chat
  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    multiplayerService.sendChatMessage(chatInput, {
      name: playerName,
      avatar: activePreset.avatarEmoji,
      color: selectedColor,
    });
    setChatInput('');
  };

  const copyRoomCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const myId = multiplayerService.getCurrentPlayerId();
  const isMeHost = currentRoom?.hostId === myId;
  const canStartGame =
    isMeHost &&
    currentRoom &&
    currentRoom.players.length >= 2 &&
    currentRoom.players.every((p) => p.isReady || p.isHost);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 select-none">
      <div className="bg-[#fffdf7] max-w-xl w-full rounded-3xl border-4 border-slate-900 comic-box shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-4 border-b-3 border-slate-900 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-yellow-300 animate-spin-slow" />
            <div>
              <h2 className="text-xl font-black font-comic tracking-wide leading-tight flex items-center gap-2">
                Mabar Online Real-Time
                <span className="text-[10px] bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  Multiplayer
                </span>
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Main bareng teman via Room Code · Simulator Warga62
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (viewState === 'LOBBY') handleLeaveRoom();
              onClose();
            }}
            className="p-1 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-slate-900 text-xs">
          {/* VIEW 1: SETUP (Create / Join) */}
          {viewState === 'SETUP' && (
            <div className="space-y-4">
              {/* Tab Selector: Create Room vs Join Room */}
              <div className="flex border-2 border-slate-900 rounded-2xl bg-amber-100/60 p-1 gap-1 text-xs font-black font-comic">
                <button
                  onClick={() => {
                    setActiveTab('CREATE');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'CREATE'
                      ? 'bg-blue-600 text-white border-2 border-slate-900 shadow-xs'
                      : 'text-slate-700 hover:bg-amber-200/50'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  Bikin Room Baru
                </button>
                <button
                  onClick={() => {
                    setActiveTab('JOIN');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'JOIN'
                      ? 'bg-emerald-600 text-white border-2 border-slate-900 shadow-xs'
                      : 'text-slate-700 hover:bg-amber-200/50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Gabung Room Teman
                </button>
              </div>

              {/* Character & Name Customization */}
              <div className="bg-amber-50 rounded-2xl border-2 border-slate-900 p-3.5 space-y-3">
                <p className="font-bold font-comic text-slate-800 uppercase tracking-wider text-[11px]">
                  1. Profil Karakter Kamu:
                </p>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <div
                    className="w-16 h-16 rounded-2xl border-3 border-slate-900 flex items-center justify-center text-3xl shadow-sm shrink-0"
                    style={{ backgroundColor: selectedColor }}
                  >
                    {activePreset.avatarEmoji}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-0.5">
                        Nama Pemain:
                      </label>
                      <input
                        type="text"
                        value={playerName}
                        maxLength={20}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Masukkan nama kamu..."
                        className="w-full px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-white font-comic text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-slate-500 font-bold shrink-0">Warna Pion:</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {['#0284c7', '#e11d48', '#16a34a', '#ca8a04', '#9333ea', '#ea580c'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-5 h-5 rounded-full border-2 border-slate-900 cursor-pointer transition-transform ${
                              selectedColor === color ? 'scale-125 ring-2 ring-blue-400' : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preset Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-slate-700 font-bold font-comic uppercase tracking-wider block">
                      Pilih Karakter Warga ({CHARACTER_PRESETS.length} Pilihan):
                    </label>
                    <span className="text-[10px] text-blue-600 font-bold">
                      {activePreset.name} ({activePreset.role})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1 bg-slate-100/70 rounded-2xl border-2 border-slate-300">
                    {CHARACTER_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedPresetId(preset.id)}
                        className={`p-2 rounded-xl border-2 text-left cursor-pointer transition-all ${
                          selectedPresetId === preset.id
                            ? 'bg-blue-100 border-slate-900 shadow-sm ring-2 ring-blue-500 scale-102'
                            : 'bg-white border-slate-300 hover:border-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xl mb-0.5">{preset.avatarEmoji}</div>
                        <p className="font-bold font-comic text-[11px] leading-tight text-slate-900 truncate">
                          {preset.name}
                        </p>
                        <p className="text-[9px] text-slate-500 truncate">{preset.role}</p>
                      </button>
                    ))}
                  </div>

                  {/* Active Character Perk Spotlight Card */}
                  <div className="mt-2.5 p-2.5 bg-amber-100/80 rounded-xl border-2 border-amber-300 text-xs flex items-start gap-2.5">
                    <span className="text-lg shrink-0 mt-0.5">{activePreset.avatarEmoji}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-amber-950 font-comic">{activePreset.name}</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-mono font-bold">
                          {activePreset.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-snug mt-0.5">
                        <strong className="text-amber-900">✨ Skill Khusus:</strong> {activePreset.perkDescription}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Content: CREATE */}
              {activeTab === 'CREATE' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white p-3 rounded-2xl border-2 border-slate-900">
                    <span className="font-bold text-slate-800">Maksimal Pemain:</span>
                    <div className="flex gap-2">
                      {[2, 3, 4].map((count) => (
                        <button
                          key={count}
                          onClick={() => setMaxPlayers(count)}
                          className={`px-3 py-1 rounded-xl border-2 font-bold cursor-pointer transition-all ${
                            maxPlayers === count
                              ? 'bg-blue-600 text-white border-slate-900'
                              : 'bg-slate-100 border-slate-300 text-slate-700'
                          }`}
                        >
                          {count} Orang
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCreateRoom}
                    disabled={isConnecting || !playerName.trim()}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black font-comic text-sm uppercase tracking-wider rounded-2xl border-3 border-slate-900 comic-box-sm cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Menyiapkan Room Mabar...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        Bikin Room & Masuk Lobby
                      </>
                    )}
                  </button>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-600 font-bold">
                    <span>Atau tes lobi tanpa internet:</span>
                    <button
                      type="button"
                      onClick={handleCreateSimulationRoom}
                      className="text-blue-700 hover:text-blue-900 underline flex items-center gap-1 cursor-pointer font-black"
                    >
                      🎮 Coba Mode Simulasi Lobi →
                    </button>
                  </div>
                </div>
              )}

              {/* Tab Content: JOIN */}
              {activeTab === 'JOIN' && (
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      Masukkan Kode Room dari Teman:
                    </label>
                    <input
                      type="text"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      placeholder="CONTOH: WARGA-ABCD"
                      className="w-full font-mono font-black text-base uppercase px-4 py-2.5 rounded-xl border-2 border-slate-900 bg-white tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none text-center"
                    />
                  </div>

                  <button
                    onClick={handleJoinRoom}
                    disabled={isConnecting || !roomCodeInput.trim() || !playerName.trim()}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black font-comic text-sm uppercase tracking-wider rounded-2xl border-3 border-slate-900 comic-box-sm cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Menghubungkan ke Room...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 text-yellow-300" />
                        Gabung ke Permainan!
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Error Message with Quick Action */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl border-2 border-slate-900 bg-rose-100 text-rose-950 flex flex-col gap-2 font-bold text-xs shadow-xs">
                  <div className="flex items-start gap-2">
                    <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{errorMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateSimulationRoom}
                    className="self-end px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-[11px] font-black font-comic cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <span>Coba Mode Simulasi Lobi (Langsung Masuk)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: IN-LOBBY ROOM WAITING */}
          {viewState === 'LOBBY' && currentRoom && (
            <div className="space-y-4">
              {/* Room Code Card */}
              <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 p-4 rounded-2xl border-3 border-slate-900 comic-box-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-950">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-yellow-300 px-2 py-0.5 rounded-md">
                      Kode Room Mabar
                    </span>
                    {multiplayerService.getIsSimulationMode() && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-700 text-white px-2 py-0.5 rounded-md">
                        Mode Simulasi Lobi
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black font-mono tracking-widest mt-1">
                    {currentRoom.code}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-800">
                    Kirim kode ini ke temanmu agar mereka bisa bergabung!
                  </p>
                </div>

                <button
                  onClick={copyRoomCode}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-black font-comic text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-yellow-300" />}
                  {copiedCode ? 'Tersalin!' : 'Salin Kode'}
                </button>
              </div>

              {/* Connected Players Slots */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>Warga di Dalam Room ({currentRoom.players.length}/{currentRoom.maxPlayers}):</span>
                  {currentRoom.players.length < 2 && (
                    <span className="text-amber-700 text-[11px] font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> Menunggu teman bergabung...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Connected Players */}
                  {currentRoom.players.map((p) => {
                    const isMe = p.id === myId;
                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-2xl border-2 border-slate-900 flex items-center justify-between gap-2 shadow-xs transition-all ${
                          isMe ? 'bg-amber-50 ring-2 ring-amber-400' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl border-2 border-slate-900 flex items-center justify-center text-xl shrink-0"
                            style={{ backgroundColor: p.color }}
                          >
                            {p.avatarEmoji}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="font-black font-comic text-slate-900 text-xs truncate">
                                {p.name}
                              </p>
                              {p.isHost && (
                                <span title="Host Room">
                                  <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">
                              {isMe ? '(Kamu)' : p.isHost ? 'Pemilik Room' : 'Pemain'}
                            </p>
                          </div>
                        </div>

                        <div>
                          {p.isHost ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md border border-amber-400">
                              Host
                            </span>
                          ) : p.isReady ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-md border border-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Siap
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md">
                              Belum Siap
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty Slots */}
                  {[...Array(Math.max(0, currentRoom.maxPlayers - currentRoom.players.length))].map((_, i) => (
                    <div
                      key={`empty_${i}`}
                      className="p-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 flex items-center justify-center gap-2 text-slate-400 italic font-medium"
                    >
                      <Users className="w-4 h-4 opacity-50" />
                      <span>Slot Kosong (Menunggu Warga)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lobby Quick Chat */}
              <div className="bg-white rounded-2xl border-2 border-slate-900 p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-bold font-comic text-slate-700 text-[11px]">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Obrolan Lobby:</span>
                </div>

                <div className="bg-slate-50 rounded-xl p-2 h-20 overflow-y-auto space-y-1 border border-slate-200 text-[11px]">
                  {lobbyChat.length === 0 ? (
                    <p className="text-slate-400 italic text-center py-2">
                      Kirim pesan atau sapa temanmu sebelum mulai...
                    </p>
                  ) : (
                    lobbyChat.map((chat, idx) => (
                      <p key={idx} className="leading-tight">
                        <span className="font-bold" style={{ color: chat.color }}>
                          {chat.sender}:
                        </span>{' '}
                        <span className="text-slate-800">{chat.text}</span>
                      </p>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ketik pesan lobby..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold font-comic text-xs cursor-pointer hover:bg-blue-700"
                  >
                    Kirim
                  </button>
                </form>
              </div>

              {/* Action Buttons in Lobby */}
              <div className="flex gap-2.5 pt-2 border-t-2 border-slate-200">
                <button
                  onClick={handleLeaveRoom}
                  className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold font-comic rounded-2xl border-2 border-slate-900 cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>

                {isMeHost ? (
                  <button
                    onClick={handleStartGame}
                    disabled={!canStartGame}
                    className="flex-1 py-3 bg-amber-400 hover:bg-amber-500 active:scale-[0.98] text-slate-950 font-black font-comic text-sm uppercase tracking-wider rounded-2xl border-3 border-slate-900 comic-box-sm cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    {currentRoom.players.length < 2
                      ? 'Menunggu Minimal 2 Pemain...'
                      : !currentRoom.players.every((p) => p.isReady || p.isHost)
                      ? 'Menunggu Pemain Lain Siap...'
                      : 'Mulai Permainan Mabar!'}
                  </button>
                ) : (
                  <button
                    onClick={handleToggleReady}
                    className={`flex-1 py-3 font-black font-comic text-sm uppercase tracking-wider rounded-2xl border-3 border-slate-900 comic-box-sm cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all ${
                      currentRoom.players.find((p) => p.id === myId)?.isReady
                        ? 'bg-rose-500 hover:bg-rose-600 text-white'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {currentRoom.players.find((p) => p.id === myId)?.isReady ? 'Batal Siap' : 'Saya Sudah Siap!'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
