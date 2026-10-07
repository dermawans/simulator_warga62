import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Player,
  BoardTile,
  EconomicCondition,
  EventCard,
  LeaderboardRecord
} from './types/game';
import { INITIAL_BOARD_TILES, UPGRADE_TIERS } from './data/boardTiles';
import {
  ECONOMIC_CONDITIONS,
  NASIB_CARDS,
  KESEMPATAN_CARDS,
  RAZIA_CARDS,
  DEFAULT_LEADERBOARD,
  CORRUPTION_SCHEMES
} from './data/events';
import { soundManager } from './utils/audio';
import { formatRupiah } from './utils/formatters';

// Components
import { TopBar } from './components/TopBar';
import { EconomyTicker } from './components/EconomyTicker';
import { GameBoard, StartBonusNotification } from './components/GameBoard';
import { PlayerHUD } from './components/PlayerHUD';
import { CharacterCustomizer } from './components/CharacterCustomizer';
import { TileDetailModal } from './components/TileDetailModal';
import { CorruptionModal } from './components/CorruptionModal';
import { SabotageModal } from './components/SabotageModal';
import { TaxModal } from './components/TaxModal';
import { EventModal } from './components/EventModal';
import { ViralNewsModal } from './components/ViralNewsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { RulesModal } from './components/RulesModal';
import { PlayersOverviewBar } from './components/PlayersOverviewBar';
import { KarmaInfoModal } from './components/KarmaInfoModal';
import { GameOverModal } from './components/GameOverModal';
import { LiquidationEffectModal, LiquidatedPropertyInfo } from './components/LiquidationEffectModal';
import { SaveLoadModal } from './components/SaveLoadModal';
import { GameSaveData } from './utils/supabase';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { OnlineChatDrawer } from './components/OnlineChatDrawer';
import { multiplayerService } from './services/multiplayer';
import { RoomState, ChatMessage, RoomPlayer } from './types/multiplayer';
import { DiceRollOverlay, DiceOverlayState } from './components/DiceRollOverlay';
import { FeedbackModal } from './components/FeedbackModal';
import { CHARACTER_PRESETS } from './data/characters';

export default function App() {
  const [gameState, setGameState] = useState<'SETUP' | 'PLAYING' | 'GAME_OVER'>('SETUP');
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [tiles, setTiles] = useState<BoardTile[]>(INITIAL_BOARD_TILES);
  const [diceRoll, setDiceRoll] = useState<[number, number]>([1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const [isHopping, setIsHopping] = useState(false);
  const [hoppingPlayerId, setHoppingPlayerId] = useState<string | null>(null);
  const [stepHighlightedTileId, setStepHighlightedTileId] = useState<number | null>(null);
  const [liquidatingTileIds, setLiquidatingTileIds] = useState<number[]>([]);
  const [startBonusPopup, setStartBonusPopup] = useState<StartBonusNotification | null>(null);
  const [saveLoadModalOpen, setSaveLoadModalOpen] = useState(false);
  const [onlineLobbyOpen, setOnlineLobbyOpen] = useState(false);
  const [multiplayerRoom, setMultiplayerRoom] = useState<RoomState | null>(null);
  const [myOnlinePlayerId, setMyOnlinePlayerId] = useState<string | null>(() => multiplayerService.getCurrentPlayerId());
  const [onlineChatMessages, setOnlineChatMessages] = useState<ChatMessage[]>([]);
  const [diceOverlayState, setDiceOverlayState] = useState<DiceOverlayState | null>(null);
  const [liquidatingPropsModal, setLiquidatingPropsModal] = useState<{
    playerName: string;
    playerAvatar: string;
    properties: LiquidatedPropertyInfo[];
    isTotalBankruptcy: boolean;
    totalCashRecovered: number;
  } | null>(null);
  const [hasRolled, setHasRolled] = useState(false);
  const [recentLog, setRecentLog] = useState<string>('Selamat datang di Simulator Warga62!');
  const [arisanPot, setArisanPot] = useState<number>(6500000);
  const [roundCount, setRoundCount] = useState<number>(1);
  const [gameOverData, setGameOverData] = useState<{
    winner: Player;
    reason: 'ELIMINATION' | 'TARGET_REACHED' | 'ROUNDS_COMPLETED';
    totalRounds: number;
  } | null>(null);

  // Economic system
  const [economicIndex, setEconomicIndex] = useState(0);
  const [economicTurnCountdown, setEconomicTurnCountdown] = useState(5);

  // Audio mute
  const [isMuted, setIsMuted] = useState(false);

  // Modals
  const [inspectedTile, setInspectedTile] = useState<BoardTile | null>(null);
  const [corruptionModalOpen, setCorruptionModalOpen] = useState(false);
  const [sabotageModalOpen, setSabotageModalOpen] = useState(false);
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [karmaModalPlayer, setKarmaModalPlayer] = useState<Player | null>(null);
  const [eventCard, setEventCard] = useState<EventCard | null>(null);
  const [viralNews, setViralNews] = useState<{
    player: Player;
    data: {
      type: 'BUSTED_KPK' | 'WON_ARISAN' | 'BANKRUPT_PINJOL' | 'BECOME_SULTAN';
      headline: string;
      subheadline: string;
      story: string;
      quoteWarga: string;
      fineAmount?: number;
    };
  } | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState<LeaderboardRecord[]>(() => {
    try {
      const saved = localStorage.getItem('simulator_wni_leaderboard');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_LEADERBOARD;
  });

  const saveLeaderboard = (newRecords: LeaderboardRecord[]) => {
    setLeaderboard(newRecords);
    try {
      localStorage.setItem('simulator_wni_leaderboard', JSON.stringify(newRecords));
    } catch {
      // ignore
    }
  };

  const activePlayer = players[activePlayerIndex] || null;
  const currentTile = activePlayer ? tiles[activePlayer.position] : tiles[0];
  const currentEconomic = ECONOMIC_CONDITIONS[economicIndex];
  const currentMyId = myOnlinePlayerId || (multiplayerRoom ? multiplayerService.getCurrentPlayerId() : null);
  const isOnlineMode = !!multiplayerRoom;
  const isMyTurnOnline = !isOnlineMode || (activePlayer !== null && activePlayer.id === currentMyId);
  const myOnlinePlayer = isOnlineMode ? players.find((p) => p.id === currentMyId) || null : null;

  // Calculate Net Worth for a player
  const calculateNetWorth = (p: Player) => {
    let total = p.money;
    tiles.forEach((t) => {
      if (t.ownerId === p.id) {
        total += t.price + t.houses * t.housePrice;
      }
    });
    return total;
  };

  // Helper: Otomatis mencairkan (menjual) kavling & renovasi rumah saat kas Rp 0
  const autoLiquidatePlayer = (
    player: Player,
    currentTiles: BoardTile[],
    targetMinCash: number = 0
  ): { updatedPlayer: Player; updatedTiles: BoardTile[]; liquidatedItems: string[]; totalRecovered: number } => {
    let recovered = 0;
    const soldItems: string[] = [];
    const liquidatedDetails: LiquidatedPropertyInfo[] = [];
    const updatedTiles = [...currentTiles];
    const updatedPlayer = { ...player };

    // 1. Cairkan renovasi rumah terlebih dahulu (75% harga renovasi)
    for (let i = 0; i < updatedTiles.length; i++) {
      if (updatedPlayer.money + recovered > targetMinCash) break;
      const t = updatedTiles[i];
      if (t.ownerId === updatedPlayer.id && t.houses > 0) {
        const refundPerHouse = Math.round(t.housePrice * 0.75);
        const houseRefund = refundPerHouse * t.houses;
        recovered += houseRefund;
        soldItems.push(`Renovasi ${t.name} (+${formatRupiah(houseRefund)})`);
        liquidatedDetails.push({
          id: t.id,
          name: `Renovasi ${t.name}`,
          city: t.city,
          price: t.housePrice * t.houses,
          houses: t.houses,
          refundAmount: houseRefund,
          colorTag: t.colorTag,
        });
        updatedTiles[i] = { ...t, houses: 0 };
      }
    }

    // 2. Cairkan kavling tanah ke bank (75% harga beli) jika kas masih <= 0
    for (let i = 0; i < updatedTiles.length; i++) {
      if (updatedPlayer.money + recovered > targetMinCash) break;
      const t = updatedTiles[i];
      if (t.ownerId === updatedPlayer.id) {
        const propRefund = Math.round(t.price * 0.75);
        recovered += propRefund;
        soldItems.push(`${t.name} (+${formatRupiah(propRefund)})`);
        liquidatedDetails.push({
          id: t.id,
          name: t.name,
          city: t.city,
          price: t.price,
          houses: t.houses,
          refundAmount: propRefund,
          colorTag: t.colorTag,
        });
        updatedTiles[i] = { ...updatedTiles[i], ownerId: null, houses: 0 };
      }
    }

    updatedPlayer.money += recovered;

    if (liquidatedDetails.length > 0) {
      soundManager.playMoney();
      soundManager.playRoaringFire();
      soundManager.playBurningPaper();
      setLiquidatingTileIds(liquidatedDetails.map((item) => item.id));
      setTimeout(() => setLiquidatingTileIds([]), 4500);

      setLiquidatingPropsModal({
        playerName: updatedPlayer.name,
        playerAvatar: updatedPlayer.avatarEmoji,
        properties: liquidatedDetails,
        isTotalBankruptcy: updatedPlayer.money <= 0,
        totalCashRecovered: recovered,
      });

      setRecentLog(
        `⚠️ DANA TALANGAN LIKUIDASI! Saldo kas ${updatedPlayer.name} habis, aset [${soldItems.join(', ')}] otomatis dicairkan ke bank (+${formatRupiah(recovered)}) agar kembali punya uang kas!`
      );
    }

    if (updatedPlayer.money <= 0) {
      // Benar-benar bangkrut jika seluruh properti ludes dan saldo tetap <= 0
      updatedPlayer.isBankrupt = true;
      setRecentLog(
        `💥 BANGKRUT TOTAL! Seluruh kavling milik ${updatedPlayer.name} telah ludes terjual dan saldo Rp 0. ${updatedPlayer.name} resmi PAILIT!`
      );
      setViralNews({
        player: updatedPlayer,
        data: {
          type: 'BANKRUPT_PINJOL',
          headline: `PAILIT TOTAL: ${updatedPlayer.name} Gulung Tikar Tanpa Sisa Aset!`,
          subheadline: 'Seluruh Kavling & Properti Ludes Terjual ke Bank',
          story: `Kondisi kas ${updatedPlayer.name} mencapai titik nadir Rp 0 tanpa menyisakan satu pun kavling usaha. Pengadilan Niaga resmi menetapkan ${updatedPlayer.name} pailit!`,
          quoteWarga: 'Dulu gayanya selangit, sekarang bayar parkir saja tak sanggup.',
        },
      });
    }

    return { updatedPlayer, updatedTiles, liquidatedItems: soldItems, totalRecovered: recovered };
  };

  // Turn check: Otomatis cairkan aset jika saldo kas pemain aktif 0
  useEffect(() => {
    if (gameState !== 'PLAYING' || !activePlayer || isHopping) return;

    if (activePlayer.money <= 0 && !activePlayer.isBankrupt) {
      const hasOwnedProps = tiles.some((t) => t.ownerId === activePlayer.id);
      if (hasOwnedProps) {
        const { updatedPlayer, updatedTiles } = autoLiquidatePlayer(activePlayer, tiles, 0);
        setPlayers((prev) => {
          const next = [...prev];
          next[activePlayerIndex] = updatedPlayer;
          return next;
        });
        setTiles(updatedTiles);
      }
    }
  }, [activePlayerIndex, activePlayer?.money, gameState, isHopping]);

  // Bot Turn Handler
  const botTurnTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState !== 'PLAYING' || !activePlayer || !activePlayer.isBot || isHopping) return;
    if (multiplayerRoom && multiplayerService.getCurrentPlayerId() !== multiplayerRoom.hostId) return;

    // AI Bot thinking delay
    botTurnTimerRef.current = window.setTimeout(() => {
      if (!activePlayer.isBot || isHopping) return;

      if (activePlayer.inJail) {
        if (activePlayer.money >= 10000000) {
          // Bribe out of jail
          handlePayBail();
        } else {
          // Serve time safely without stuck
          handleEndTurn();
        }
        return;
      }

      if (!hasRolled && !isRolling && !isHopping) {
        handleRollDice();
      } else if (hasRolled && !isHopping) {
        // Decide whether to buy unowned property
        const tile = tiles[activePlayer.position];
        if (
          (tile.type === 'property' || tile.type === 'bumn') &&
          !tile.ownerId &&
          activePlayer.money >= tile.price + 3000000
        ) {
          handleBuyProperty();
        }

        // Small chance for greedy bot to do corruption if low money
        if (activePlayer.money < 5000000 && activePlayer.karma < 40 && Math.random() < 0.4) {
          const scheme = CORRUPTION_SCHEMES[0];
          handleCommitCorruption(scheme, false);
        }

        setTimeout(() => {
          handleEndTurn();
        }, 1200);
      }
    }, 1100);

    return () => {
      if (botTurnTimerRef.current) clearTimeout(botTurnTimerRef.current);
    };
  }, [gameState, activePlayerIndex, hasRolled, isRolling, isHopping]);

  // Remote Multiplayer Listeners
  useEffect(() => {
    const unsubAction = multiplayerService.onGameAction((action, senderId) => {
      switch (action.type) {
        case 'ROLL_DICE': {
          soundManager.playDiceRoll();
          const validDice: [number, number] =
            Array.isArray(action.dice) &&
            typeof action.dice[0] === 'number' &&
            !isNaN(action.dice[0]) &&
            typeof action.dice[1] === 'number' &&
            !isNaN(action.dice[1])
              ? [action.dice[0], action.dice[1]]
              : [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
          const validSteps =
            typeof action.steps === 'number' && !isNaN(action.steps) && action.steps > 0
              ? action.steps
              : validDice[0] + validDice[1];

          const roller = players.find((p) => p.id === senderId) || activePlayer;
          setIsRolling(true);
          setDiceOverlayState({
            isOpen: true,
            isRolling: true,
            dice: [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1],
            player: roller,
            totalSteps: validSteps,
          });

          setTimeout(() => {
            setDiceRoll(validDice);
            soundManager.playDiceLand();
            setDiceOverlayState({
              isOpen: true,
              isRolling: false,
              dice: validDice,
              player: roller,
              totalSteps: validSteps,
            });

            setTimeout(() => {
              setDiceOverlayState(null);
              setIsRolling(false);
              setHasRolled(true);
              movePlayer(validSteps);
            }, 1000);
          }, 650);
          break;
        }

        case 'BUY_PROPERTY': {
          soundManager.playMoney();
          setTiles((prev) => {
            const next = [...prev];
            next[action.tileId] = {
              ...next[action.tileId],
              ownerId: senderId,
            };
            return next;
          });
          setPlayers((prev) => {
            const next = [...prev];
            const pIdx = next.findIndex((p) => p.id === senderId);
            const tile = tiles[action.tileId];
            if (pIdx !== -1 && tile) {
              next[pIdx] = {
                ...next[pIdx],
                money: Math.max(0, next[pIdx].money - tile.price),
              };
            }
            return next;
          });
          break;
        }

        case 'UPGRADE_PROPERTY': {
          soundManager.playMoney();
          setTiles((prev) => {
            const next = [...prev];
            next[action.tileId] = {
              ...next[action.tileId],
              houses: action.newHouses,
            };
            return next;
          });
          setPlayers((prev) => {
            const next = [...prev];
            const pIdx = next.findIndex((p) => p.id === senderId);
            const tile = tiles[action.tileId];
            if (pIdx !== -1 && tile) {
              next[pIdx] = {
                ...next[pIdx],
                money: Math.max(0, next[pIdx].money - tile.housePrice),
              };
            }
            return next;
          });
          break;
        }

        case 'SELL_PROPERTY': {
          const tile = tiles[action.tileId];
          if (!tile) break;
          const refund = Math.round(tile.price * 0.75 + tile.houses * tile.housePrice * 0.75);
          soundManager.playMoney();
          soundManager.playRoaringFire();
          soundManager.playBurningPaper();
          setTiles((prev) => {
            const next = [...prev];
            next[action.tileId] = {
              ...next[action.tileId],
              ownerId: null,
              houses: 0,
            };
            return next;
          });
          setPlayers((prev) => {
            const next = [...prev];
            const pIdx = next.findIndex((p) => p.id === senderId);
            if (pIdx !== -1) {
              next[pIdx] = {
                ...next[pIdx],
                money: next[pIdx].money + refund,
              };
            }
            return next;
          });
          break;
        }

        case 'PAY_BAIL': {
          soundManager.playMoney();
          setPlayers((prev) => {
            const next = [...prev];
            const pIdx = next.findIndex((p) => p.id === senderId);
            if (pIdx !== -1) {
              next[pIdx] = {
                ...next[pIdx],
                inJail: false,
                jailTurns: 0,
                money: Math.max(0, next[pIdx].money - action.amount),
              };
            }
            return next;
          });
          break;
        }

        case 'END_TURN': {
          setActivePlayerIndex(action.nextPlayerIndex);
          setRoundCount(action.roundCount);
          setHasRolled(false);
          setIsRolling(false);
          setIsHopping(false);
          setRecentLog(`Giliran beralih ke ${players[action.nextPlayerIndex]?.name || 'Pemain Berikutnya'}.`);
          break;
        }

        case 'CORRUPTION': {
          const scheme = CORRUPTION_SCHEMES.find((s) => s.id === action.schemeId);
          if (!scheme) break;
          const pIdx = players.findIndex((p) => p.id === senderId);
          if (pIdx === -1) break;

          if (action.isBusted) {
            soundManager.playSiren();
            setTimeout(() => soundManager.playGavel(), 400);
            const fine = Math.round(scheme.reward * 0.7);
            setPlayers((prev) => {
              const next = [...prev];
              next[pIdx] = {
                ...next[pIdx],
                inJail: true,
                jailTurns: 3,
                position: 24,
                money: Math.max(0, next[pIdx].money - fine),
                totalBribes: next[pIdx].totalBribes + scheme.reward,
                karma: 10,
              };
              return next;
            });
            setRecentLog(`🚨 OTT KPK! ${players[pIdx].name} tertangkap tangan korupsi ${scheme.name}!`);
          } else {
            soundManager.playMoney();
            let gain = scheme.reward;
            if (players[pIdx].characterId === 'pejabat') gain = Math.round(gain * 1.2);
            setPlayers((prev) => {
              const next = [...prev];
              next[pIdx] = {
                ...next[pIdx],
                money: next[pIdx].money + gain,
                totalBribes: next[pIdx].totalBribes + gain,
                karma: Math.min(100, next[pIdx].karma + scheme.karmaCost),
              };
              return next;
            });
            setRecentLog(`💰 ${players[pIdx].name} mencairkan proyek ${scheme.name}!`);
          }
          break;
        }

        case 'SABOTAGE': {
          soundManager.playGavel();
          const senderIdx = players.findIndex((p) => p.id === senderId);
          const targetIdx = players.findIndex((p) => p.id === action.targetPlayerId);
          if (senderIdx === -1 || targetIdx === -1) break;

          // Target is immune if Siti Hacker (programmer_scam)
          if (players[targetIdx].characterId === 'programmer_scam') {
            soundManager.playBoing();
            setRecentLog(`🛡️ Sabotase Gagal! ${players[targetIdx].name} (Siti Hacker) kebal sabotase lawan!`);
            break;
          }

          const isHackerSender = players[senderIdx].characterId === 'programmer_scam';
          const discount = isHackerSender ? 1000000 : 0;

          if (action.skillId === 'satpol_pp') {
            const fine = 3500000;
            const cost = Math.max(1000000, 2500000 - discount);
            setPlayers((prev) => {
              const next = [...prev];
              next[senderIdx].money = Math.max(0, next[senderIdx].money - cost);
              next[targetIdx].money = Math.max(0, next[targetIdx].money - fine);
              return next;
            });
            setRecentLog(`${players[senderIdx].name} memanggil Satpol PP untuk menggusur ${players[targetIdx].name}!`);
          } else if (action.skillId === 'audit_pajak') {
            const cost = Math.max(1000000, 4000000 - discount);
            setPlayers((prev) => {
              const next = [...prev];
              next[senderIdx].money = Math.max(0, next[senderIdx].money - cost);
              const cut = Math.round(next[targetIdx].money * 0.2);
              next[targetIdx].money = Math.max(0, next[targetIdx].money - cut);
              return next;
            });
            setRecentLog(`Ditjen Pajak mengaudit ${players[targetIdx].name} atas laporan ${players[senderIdx].name}!`);
          } else if (action.skillId === 'santet_bisnis') {
            const cost = Math.max(1000000, 3000000 - discount);
            setPlayers((prev) => {
              const next = [...prev];
              next[senderIdx].money = Math.max(0, next[senderIdx].money - cost);
              return next;
            });
            setRecentLog(`🕯️ ${players[senderIdx].name} mengirim santet ke properti ${players[targetIdx].name}!`);
          }
          break;
        }

        case 'FULL_STATE_SYNC': {
          setPlayers(action.players);
          setTiles(action.tiles);
          setActivePlayerIndex(action.activePlayerIndex);
          setRoundCount(action.roundCount);
          setArisanPot(action.arisanPot);
          setEconomicIndex(action.economicIndex);
          break;
        }
      }
    });

    const unsubChat = multiplayerService.onChatMessage((msg) => {
      setOnlineChatMessages((prev) => [...prev.slice(-25), msg]);
    });

    return () => {
      unsubAction();
      unsubChat();
    };
  }, [tiles, players, activePlayerIndex, roundCount, multiplayerRoom]);

  // Audio toggle
  const handleToggleAudio = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Start game from customizer
  const handleStartGame = (configuredPlayers: Player[]) => {
    setPlayers(configuredPlayers);
    setActivePlayerIndex(0);
    setGameState('PLAYING');
    setHasRolled(false);
    setRecentLog(`Permainan dimulai! Giliran pertama: ${configuredPlayers[0].name}.`);
  };

  // Start game from online multiplayer lobby
  const handleStartMultiplayerGame = (room: RoomState, roomPlayers: RoomPlayer[]) => {
    const onlinePlayers: Player[] = roomPlayers.map((rp) => {
      const charPreset = CHARACTER_PRESETS.find((p) => p.id === rp.characterId) || CHARACTER_PRESETS[0];
      const startingMoney = rp.characterId === 'bos_pinjol' ? 25000000 : 20000000;
      return {
        id: rp.id,
        name: rp.name,
        role: charPreset.role,
        characterId: rp.characterId || charPreset.id,
        avatarEmoji: rp.avatarEmoji || charPreset.avatarEmoji,
        accessory: rp.accessory || charPreset.accessory,
        quote: rp.quote || charPreset.quote,
        color: rp.color || charPreset.color,
        money: startingMoney,
        position: 0,
        inJail: false,
        jailTurns: 0,
        karma: 0,
        totalBribes: 0,
        totalTaxesPaid: 0,
        sabotagesRemaining: rp.characterId === 'programmer_scam' ? 4 : 2,
        isBankrupt: false,
        isBot: false,
      };
    });

    setPlayers(onlinePlayers);
    setMultiplayerRoom(room);
    setMyOnlinePlayerId(multiplayerService.getCurrentPlayerId());
    setTiles(INITIAL_BOARD_TILES);
    setActivePlayerIndex(0);
    setRoundCount(1);
    setArisanPot(6500000);
    setEconomicIndex(0);
    setEconomicTurnCountdown(5);
    setGameState('PLAYING');
    setHasRolled(false);
    setGameOverData(null);
    setRecentLog(`🌐 Permainan Mabar Online dimulai di Room ${room.code}!`);
  };

  // Roll Dice & Move
  const handleRollDice = (customRoll?: any) => {
    if (isRolling || hasRolled || isHopping || !activePlayer) return;
    if (isOnlineMode && !isMyTurnOnline) {
      soundManager.playBoing();
      return;
    }

    setIsRolling(true);
    soundManager.playDiceRoll();

    // Verify if customRoll is truly a valid [number, number] tuple and not a React event object
    const isCustom =
      Array.isArray(customRoll) &&
      typeof customRoll[0] === 'number' &&
      !isNaN(customRoll[0]) &&
      typeof customRoll[1] === 'number' &&
      !isNaN(customRoll[1]);

    const d1 = isCustom ? customRoll[0] : Math.floor(Math.random() * 6) + 1;
    const d2 = isCustom ? customRoll[1] : Math.floor(Math.random() * 6) + 1;
    const totalSteps = d1 + d2;

    // Phase 1: Show rolling shaker/tumbling modal
    setDiceOverlayState({
      isOpen: true,
      isRolling: true,
      dice: [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1],
      player: activePlayer,
      totalSteps,
    });

    // Broadcast to other players if in online room
    if (multiplayerRoom && !isCustom) {
      multiplayerService.sendAction({
        type: 'ROLL_DICE',
        dice: [d1, d2],
        steps: totalSteps,
      });
    }

    // Roll duration: 700ms
    setTimeout(() => {
      // Phase 2: Reveal landed result with audio clack & chime
      setDiceRoll([d1, d2]);
      soundManager.playDiceLand();
      setDiceOverlayState({
        isOpen: true,
        isRolling: false,
        dice: [d1, d2],
        player: activePlayer,
        totalSteps,
      });

      // Display result clearly for 1100ms before starting to move
      setTimeout(() => {
        setDiceOverlayState(null);
        setIsRolling(false);
        setHasRolled(true);
        movePlayer(totalSteps);
      }, 1100);
    }, 700);
  };

  const movePlayer = (steps: number) => {
    if (!activePlayer) return;

    // Safety fallback: ensure steps is always a positive integer
    const safeSteps =
      typeof steps === 'number' && !isNaN(steps) && steps > 0 ? Math.round(steps) : 2;

    setIsHopping(true);
    setHoppingPlayerId(activePlayer.id);

    let currentStep = 0;
    let currentPos = activePlayer.position;
    let accumulatedMoney = activePlayer.money;

    const stepInterval = window.setInterval(() => {
      currentStep++;
      currentPos = (currentPos + 1) % 48;

      // Play hop bounce audio
      soundManager.playHop();
      setStepHighlightedTileId(currentPos);

      // Passed or landed on START (tile 0)
      if (currentPos === 0) {
        soundManager.playMoney();
        let bonus = 5000000; // Gaji UMR
        let subNote = 'Gaji Pokok WNI';
        if (activePlayer.characterId === 'mahasiswa_demo' || activePlayer.characterId === 'mahasiswa') {
          bonus += 2500000; // Mahasiswa perk (Tunjangan Magang)
          subNote = 'Termasuk Tunjangan Magang Mahasiswa';
        }
        if (accumulatedMoney < 3000000) {
          bonus += 2000000; // Bansos Warga Miskin
          subNote = 'Termasuk Subsidi Bansos Warga';
          setRecentLog(`${activePlayer.name} menerima Gaji UMR & Subsidi Bansos!`);
        } else {
          setRecentLog(`${activePlayer.name} lewat START, menerima Gaji UMR Rp 5.000.000.`);
        }
        accumulatedMoney += bonus;
        setArisanPot((prev) => prev + 500000); // 500rb masuk kas arisan

        // Trigger floating popup notification meluncur ke atas
        setStartBonusPopup({
          id: Date.now(),
          text: `+${formatRupiah(bonus)} Gaji UMR`,
          playerName: activePlayer.name,
          playerAvatar: activePlayer.avatarEmoji,
          playerColor: activePlayer.color,
          subtext: subNote,
        });

        // Auto dismiss after 2.6s
        setTimeout(() => {
          setStartBonusPopup(null);
        }, 2600);
      }

      // Update position for smooth sequential hopping
      setPlayers((prev) => {
        const next = [...prev];
        next[activePlayerIndex] = {
          ...next[activePlayerIndex],
          position: currentPos,
          money: accumulatedMoney,
        };
        return next;
      });

      // Destination reached
      if (currentStep >= safeSteps) {
        window.clearInterval(stepInterval);

        setTimeout(() => {
          setIsHopping(false);
          setHoppingPlayerId(null);
          setStepHighlightedTileId(null);

          // Trigger Tile Landing Event on the final player state
          setPlayers((latest) => {
            const finalPlayer = latest[activePlayerIndex];
            handleTileLanded(currentPos, finalPlayer);
            return latest;
          });
        }, 250);
      }
    }, 220); // 220ms per tile hop for a snappy, expressive cartoon pacing
  };

  const handleTileLanded = (tileIndex: number, player: Player) => {
    const tile = tiles[tileIndex];

    // 1. CORNER TILES
    if (tileIndex === 36) {
      // OTT KPK / CIDUK BASAH!
      soundManager.playSiren();
      soundManager.playGavel();

      const fine = 5000000;
      setPlayers((prev) => {
        const next = [...prev];
        next[activePlayerIndex] = {
          ...next[activePlayerIndex],
          inJail: true,
          jailTurns: 3,
          position: 24, // Move directly to Sukamiskin (Tile 24)
          money: Math.max(0, next[activePlayerIndex].money - fine),
          karma: 10,
        };
        return next;
      });

      setRecentLog(`🚨 OTT KPK! ${player.name} diciduk basah dan dijebloskan ke Sukamiskin!`);

      // Trigger Viral Newspaper
      setViralNews({
        player,
        data: {
          type: 'BUSTED_KPK',
          headline: `TERCYDUK KPK: ${player.name} Kena OTT Kardus Dolar!`,
          subheadline: 'Tertangkap Basah di Basement Parkir Hotel Saat Serah Terima Amplop',
          story: `Tim Satgas KPK menyergap ${player.name} yang berusaha menyamarkan uang suap dalam kardus durian montong. Aset disita senilai ${formatRupiah(fine)} dan digiring memakai rompi oranye ke Lapas Sukamiskin.`,
          quoteWarga: 'Pantesan tiap minggu renovasi rumah cat emas, ternyata doyan proyek fiktif!',
          fineAmount: fine,
        },
      });
      return;
    }

    if (tile.type === 'arisan') {
      // Arisan Warga RT
      soundManager.playFanfare();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      let jackpot = arisanPot;
      if (player.characterId === 'bandar_arisan') {
        jackpot = Math.round(jackpot * 1.25);
      }

      setPlayers((prev) => {
        const next = [...prev];
        next[activePlayerIndex] = {
          ...next[activePlayerIndex],
          money: next[activePlayerIndex].money + jackpot,
          karma: Math.max(0, next[activePlayerIndex].karma - 10),
        };
        return next;
      });

      setArisanPot(2000000); // reset baseline pot
      if (player.characterId === 'bandar_arisan') {
        setRecentLog(`🎉 EXTRA CUAN! ${player.name} (Bandar Arisan) kocok arisan & raih bonus +25%: ${formatRupiah(jackpot)}!`);
      } else {
        setRecentLog(`🎉 SELAMAT! ${player.name} menang arisan warga RT senilai ${formatRupiah(jackpot)}!`);
      }

      setEventCard({
        id: 'win_arisan',
        title: player.characterId === 'bandar_arisan' ? 'MENANG ARISAN + BONUS BANDAR! 🎁' : 'MENANG ARISAN WARGA RT! 🎁',
        category: 'ARISAN',
        description: 'Nama Anda keluar dari kocokan gelas arisan emak-emak komplek! Seluruh kas warga diserahkan kepada Anda.',
        effectDescription: `Uang tunai kas arisan bertambah +${formatRupiah(jackpot)}.`,
        moneyChange: jackpot,
        karmaChange: -10,
        isJackpot: true,
      });
      return;
    }

    if (tile.type === 'tax') {
      // Kantor Pajak Progresif
      soundManager.playGavel();
      if (!player.isBot) {
        setTaxModalOpen(true);
      } else {
        // Bot auto honest tax
        const netWorth = calculateNetWorth(player);
        let taxAmount = Math.round(netWorth * 0.03);
        if (player.characterId === 'emak_matic') {
          taxAmount = Math.round(taxAmount * 0.5);
        }
        setPlayers((prev) => {
          const next = [...prev];
          next[activePlayerIndex] = {
            ...next[activePlayerIndex],
            money: Math.max(0, next[activePlayerIndex].money - taxAmount),
            totalTaxesPaid: next[activePlayerIndex].totalTaxesPaid + taxAmount,
          };
          return next;
        });
        setRecentLog(`${player.name} membayar pajak SPT sebesar ${formatRupiah(taxAmount)}.`);
      }
      return;
    }

    if (tileIndex === 16) {
      // Preman Parkir perk: collect Rp 1.000.000 instead of paying
      if (player.characterId === 'preman_parkir') {
        soundManager.playMoney();
        const setoran = 1000000;
        setPlayers((prev) => {
          const next = [...prev];
          next[activePlayerIndex] = {
            ...next[activePlayerIndex],
            money: next[activePlayerIndex].money + setoran,
          };
          return next;
        });
        setRecentLog(`🧢 Prit-prit! ${player.name} (Bang Jago Parkir) memungut setoran parkir ${formatRupiah(setoran)} dari kas warga!`);
        return;
      }

      // Normal Parkir Liar Indomaret
      soundManager.playBoing();
      const parkingFee = 200000; // Rp 200rb
      setPlayers((prev) => {
        const next = [...prev];
        next[activePlayerIndex] = {
          ...next[activePlayerIndex],
          money: Math.max(0, next[activePlayerIndex].money - parkingFee),
        };
        return next;
      });
      setRecentLog(`${player.name} dipalak kang parkir gaib Rp 200.000.`);
      return;
    }

    if (tile.type === 'event' || tileIndex === 20) {
      // Emak-Emak Matic perk: 50% chance to dodge razia police raid
      if (tileIndex === 20 && player.characterId === 'emak_matic' && Math.random() < 0.5) {
        soundManager.playFanfare();
        setRecentLog(`🧕🏼 Sen Kiri Belok Kanan! ${player.name} berhasil lolos dari razia polisi lalu lintas tanpa kena tilang!`);
        return;
      }

      // Random Event Card
      let cardList = NASIB_CARDS;
      if (tileIndex === 20) {
        cardList = RAZIA_CARDS;
      } else if (tile.name.includes('KESEMPATAN')) {
        cardList = KESEMPATAN_CARDS;
      }
      const randomCard = cardList[Math.floor(Math.random() * cardList.length)];
      setEventCard(randomCard);
      return;
    }

    // PROPERTY RENT CHECK
    if (tile.ownerId && tile.ownerId !== player.id) {
      const owner = players.find((p) => p.id === tile.ownerId);
      if (owner && !owner.inJail) {
        let rent = Math.round(
          tile.baseRent * UPGRADE_TIERS[tile.houses].multiplier * currentEconomic.rentMultiplier
        );

        // Pak RT perk: 30% discount
        if (player.characterId === 'lurah_kumis') {
          rent = Math.round(rent * 0.7);
        }

        // Alvin SCBD perk: +25% rent in Jakarta & Jabodetabek
        const isJakselArea = tile.city === 'Jakarta' || tile.city === 'Jabodetabek' || tile.city === 'Tangerang' || tile.city === 'Bekasi' || tile.city === 'Depok' || tile.city === 'Bogor';
        if (owner.characterId === 'anak_jaksel' && isJakselArea) {
          rent = Math.round(rent * 1.25);
        }

        // Tuan Tanah Betawi perk: +15% extra rent on upgraded properties
        if (owner.characterId === 'tuan_tanah_betawi' && tile.houses > 0) {
          rent = Math.round(rent * 1.15);
        }

        soundManager.playMoney();

        // Check if joint venture exists
        const partnerId = owner.jointVentures?.[tile.id];
        const hasPartner = !!partnerId;

        setPlayers((prev) => {
          const next = [...prev];
          const currP = next[activePlayerIndex];
          const actualPaid = Math.min(currP.money, rent);

          currP.money -= actualPaid;

          if (hasPartner) {
            const split = Math.round(actualPaid / 2);
            const ownerIdx = next.findIndex((p) => p.id === owner.id);
            const partnerIdx = next.findIndex((p) => p.id === partnerId);
            if (ownerIdx !== -1) next[ownerIdx].money += split;
            if (partnerIdx !== -1) next[partnerIdx].money += split;
          } else {
            const ownerIdx = next.findIndex((p) => p.id === owner.id);
            if (ownerIdx !== -1) next[ownerIdx].money += actualPaid;
          }

          // Influencer Skincare perk: +Rp 500.000 endorsement bonus from bank
          if (owner.characterId === 'influencer_skincare') {
            const ownerIdx = next.findIndex((p) => p.id === owner.id);
            if (ownerIdx !== -1) {
              next[ownerIdx].money += 500000;
            }
          }

          // Check if money is 0 or negative: Auto-liquidate properties before bankruptcy!
          if (currP.money <= 0) {
            setTiles((prevTiles) => {
              const { updatedPlayer, updatedTiles } = autoLiquidatePlayer(currP, prevTiles, 0);
              next[activePlayerIndex] = updatedPlayer;
              return updatedTiles;
            });
          }

          return next;
        });

        if (owner.characterId === 'influencer_skincare') {
          setRecentLog(`${player.name} membayar sewa ${formatRupiah(rent)} ke ${owner.name} (${tile.name}). ✨ ${owner.name} dapat endorse Rp 500.000 dari sponsor!`);
        } else {
          setRecentLog(`${player.name} membayar sewa ${formatRupiah(rent)} ke ${owner.name} (${tile.name}).`);
        }
      }
    }
  };

  // Buy Property
  const handleBuyProperty = () => {
    if (!activePlayer) return;
    if (isOnlineMode && !isMyTurnOnline) {
      soundManager.playBoing();
      return;
    }
    const tile = tiles[activePlayer.position];
    let buyPrice = tile.price;
    if (activePlayer.characterId === 'menteri_segala_urusan') {
      buyPrice = Math.round(tile.price * 0.8); // Diskon PSN Menteri 20%
    }
    if (tile.ownerId || activePlayer.money < buyPrice) return;

    soundManager.playMoney();

    setPlayers((prev) => {
      const next = [...prev];
      next[activePlayerIndex] = {
        ...next[activePlayerIndex],
        money: next[activePlayerIndex].money - buyPrice,
      };
      return next;
    });

    setTiles((prev) => {
      const next = [...prev];
      next[activePlayer.position] = {
        ...next[activePlayer.position],
        ownerId: activePlayer.id,
      };
      return next;
    });

    if (multiplayerRoom) {
      multiplayerService.sendAction({
        type: 'BUY_PROPERTY',
        tileId: activePlayer.position,
      });
    }

    if (activePlayer.characterId === 'menteri_segala_urusan') {
      setRecentLog(`${activePlayer.name} membeli kavling ${tile.name} dengan Diskon PSN 20% seharga ${formatRupiah(buyPrice)}!`);
    } else {
      setRecentLog(`${activePlayer.name} resmi membeli kavling ${tile.name} seharga ${formatRupiah(tile.price)}!`);
    }
  };

  // Upgrade Property
  const handleUpgradeProperty = (tileId: number) => {
    if (!activePlayer) return;
    if (isOnlineMode && !isMyTurnOnline) {
      soundManager.playBoing();
      return;
    }
    const tile = tiles[tileId];
    let upgradePrice = tile.housePrice;
    if (activePlayer.characterId === 'driver_ojol') {
      upgradePrice = Math.round(tile.housePrice * 0.75); // Diskon Ojol 25%
    }
    if (tile.ownerId !== activePlayer.id || tile.houses >= 3 || activePlayer.money < upgradePrice) return;

    soundManager.playMoney();

    const newTier = tile.houses + 1;

    setPlayers((prev) => {
      const next = [...prev];
      next[activePlayerIndex] = {
        ...next[activePlayerIndex],
        money: next[activePlayerIndex].money - upgradePrice,
      };
      return next;
    });

    setTiles((prev) => {
      const next = [...prev];
      next[tileId] = {
        ...next[tileId],
        houses: newTier,
      };
      return next;
    });

    if (multiplayerRoom) {
      multiplayerService.sendAction({
        type: 'UPGRADE_PROPERTY',
        tileId,
        newHouses: newTier,
      });
    }

    if (newTier === 3) {
      confetti({ particleCount: 60, spread: 60 });
    }

    setRecentLog(
      `${activePlayer.name} merenovasi ${tile.name} menjadi ${UPGRADE_TIERS[newTier].label}!`
    );
  };

  // Sell Property to bank (75% value)
  const handleSellProperty = (tileId: number) => {
    if (!activePlayer) return;
    if (isOnlineMode && !isMyTurnOnline) {
      soundManager.playBoing();
      return;
    }
    const tile = tiles[tileId];
    if (tile.ownerId !== activePlayer.id) return;

    soundManager.playMoney();
    soundManager.playRoaringFire();
    soundManager.playBurningPaper();
    const refund = Math.round(tile.price * 0.75 + tile.houses * tile.housePrice * 0.75);

    setTiles((prev) => {
      const next = [...prev];
      next[tileId] = {
        ...next[tileId],
        ownerId: null,
        houses: 0,
      };
      return next;
    });

    setPlayers((prev) => {
      const next = [...prev];
      next[activePlayerIndex] = {
        ...next[activePlayerIndex],
        money: next[activePlayerIndex].money + refund,
      };
      return next;
    });

    if (multiplayerRoom) {
      multiplayerService.sendAction({
        type: 'SELL_PROPERTY',
        tileId,
      });
    }

    // Trigger visual burning/free-fall liquidation animation
    setLiquidatingTileIds([tileId]);
    setTimeout(() => setLiquidatingTileIds([]), 3500);

    setLiquidatingPropsModal({
      playerName: activePlayer.name,
      playerAvatar: activePlayer.avatarEmoji,
      properties: [
        {
          id: tile.id,
          name: tile.name,
          city: tile.city,
          price: tile.price,
          houses: tile.houses,
          refundAmount: refund,
          colorTag: tile.colorTag,
        },
      ],
      isTotalBankruptcy: false,
      totalCashRecovered: refund,
    });

    setRecentLog(`${activePlayer.name} menggadaikan/menjual kavling ${tile.name} ke bank seharga ${formatRupiah(refund)}.`);
  };

  // Commit Corruption Under the Table
  const handleCommitCorruption = (scheme: typeof CORRUPTION_SCHEMES[0], isBusted: boolean) => {
    if (!activePlayer) return;
    if (isOnlineMode && !isMyTurnOnline) {
      soundManager.playBoing();
      return;
    }

    setCorruptionModalOpen(false);

    if (multiplayerRoom) {
      multiplayerService.sendAction({
        type: 'CORRUPTION',
        schemeId: scheme.id,
        isBusted,
      });
    }

    if (isBusted) {
      // KPK BUSTED!
      const fine = Math.round(scheme.reward * 0.7);
      setPlayers((prev) => {
        const next = [...prev];
        next[activePlayerIndex] = {
          ...next[activePlayerIndex],
          inJail: true,
          jailTurns: 3,
          position: 24, // Lapas Sukamiskin is now Tile 24
          money: Math.max(0, next[activePlayerIndex].money - fine),
          totalBribes: next[activePlayerIndex].totalBribes + scheme.reward,
          karma: 10,
        };
        return next;
      });

      setRecentLog(`🚨 OTT KPK! ${activePlayer.name} tertangkap tangan korupsi ${scheme.name}!`);

      setViralNews({
        player: activePlayer,
        data: {
          type: 'BUSTED_KPK',
          headline: `TERCYDUK KPK: ${activePlayer.name} Tertangkap Transaksi Bawah Meja!`,
          subheadline: `Gagal Mencuci Uang Proyek ${scheme.name}`,
          story: `KPK melakukan Operasi Tangkap Tangan kilat. ${activePlayer.name} kedapatan menyimpan gepokan uang dalam tas olahraga di kafe tersembunyi. Denda sita ${formatRupiah(fine)} diberlakukan!`,
          quoteWarga: 'Pantesan gayanya necis terus, ternyata makelar tender desa toh!',
          fineAmount: fine,
        },
      });
    } else {
      // Got away with it!
      let gain = scheme.reward;
      if (activePlayer.characterId === 'pejabat') {
        gain = Math.round(gain * 1.2); // Pejabat perk: +20%
      }

      setPlayers((prev) => {
        const next = [...prev];
        next[activePlayerIndex] = {
          ...next[activePlayerIndex],
          money: next[activePlayerIndex].money + gain,
          totalBribes: next[activePlayerIndex].totalBribes + gain,
          karma: Math.min(100, next[activePlayerIndex].karma + scheme.karmaCost),
        };
        return next;
      });

      setRecentLog(
        `💰 ${activePlayer.name} berhasil mencairkan dana ${scheme.name} (+${formatRupiah(gain)})! Karma DPO naik.`
      );
    }
  };

  // Sabotage execution
  const handleExecuteSabotage = (skillId: string, targetPlayerId: string, propertyId?: number) => {
    if (!activePlayer) return;
    if (isOnlineMode && !isMyTurnOnline) {
      soundManager.playBoing();
      return;
    }
    const targetPlayer = players.find((p) => p.id === targetPlayerId);
    if (!targetPlayer) return;

    if (multiplayerRoom) {
      multiplayerService.sendAction({
        type: 'SABOTAGE',
        targetPlayerId,
        skillId,
      });
    }

    if (skillId === 'satpol_pp') {
      const fine = 3500000;
      setPlayers((prev) => {
        const next = [...prev];
        const targetIdx = next.findIndex((p) => p.id === targetPlayerId);
        const currIdx = next[activePlayerIndex];
        currIdx.money -= 2500000;
        if (targetIdx !== -1) {
          next[targetIdx].money = Math.max(0, next[targetIdx].money - fine);
        }
        return next;
      });
      setRecentLog(`${activePlayer.name} memanggil Satpol PP untuk menggusur dan mendenda ${targetPlayer.name}!`);
    } else if (skillId === 'audit_pajak') {
      setPlayers((prev) => {
        const next = [...prev];
        const targetIdx = next.findIndex((p) => p.id === targetPlayerId);
        const currIdx = next[activePlayerIndex];
        currIdx.money -= 4000000;
        if (targetIdx !== -1) {
          const cut = Math.round(next[targetIdx].money * 0.2);
          next[targetIdx].money -= cut;
          setRecentLog(`Ditjen Pajak mengaudit ${targetPlayer.name} atas laporan ${activePlayer.name}! Potong ${formatRupiah(cut)}.`);
        }
        return next;
      });
    } else if (skillId === 'santet_bisnis') {
      setPlayers((prev) => {
        const next = [...prev];
        next[activePlayerIndex].money -= 3000000;
        return next;
      });
      setRecentLog(`🕯️ ${activePlayer.name} mengirim santet usaha ke properti milik ${targetPlayer.name}!`);
    }
  };

  // Joint venture proposal
  const handleJointVenture = (partnerId: string, propertyId: number) => {
    if (!activePlayer) return;
    const partner = players.find((p) => p.id === partnerId);
    if (!partner) return;

    setPlayers((prev) => {
      const next = [...prev];
      const ownerIdx = next.findIndex((p) => p.id === activePlayer.id);
      if (ownerIdx !== -1) {
        next[ownerIdx].jointVentures = {
          ...(next[ownerIdx].jointVentures || {}),
          [propertyId]: partnerId,
        };
      }
      return next;
    });

    setRecentLog(`🤝 ${activePlayer.name} dan ${partner.name} resmi berkongsi bagi hasil pada properti!`);
  };

  // Confirm event card
  const handleConfirmEventCard = () => {
    if (!eventCard || !activePlayer) return;

    setPlayers((prev) => {
      const next = [...prev];
      const curr = next[activePlayerIndex];
      let newMoney = curr.money + eventCard.moneyChange;
      let newKarma = Math.max(0, Math.min(100, curr.karma + eventCard.karmaChange));

      curr.money = Math.max(0, newMoney);
      curr.karma = newKarma;

      if (eventCard.goToJail) {
        curr.inJail = true;
        curr.jailTurns = 3;
        curr.position = 24; // Lapas Sukamiskin
      }

      return next;
    });

    setRecentLog(`${activePlayer.name} menyelesaikan event: ${eventCard.title}`);
    setEventCard(null);
  };

  // Honest tax payment
  const handlePayHonestTax = (taxAmount: number) => {
    if (!activePlayer) return;
    setTaxModalOpen(false);

    setPlayers((prev) => {
      const next = [...prev];
      const curr = next[activePlayerIndex];
      curr.money = Math.max(0, curr.money - taxAmount);
      curr.totalTaxesPaid += taxAmount;
      curr.karma = Math.max(0, curr.karma - 15);
      return next;
    });

    setRecentLog(`${activePlayer.name} membayar SPT resmi ${formatRupiah(taxAmount)}. Karma berkurang!`);
  };

  // Evade tax
  const handleEvadeTax = (bribeAmount: number) => {
    if (!activePlayer) return;
    setTaxModalOpen(false);

    setPlayers((prev) => {
      const next = [...prev];
      const curr = next[activePlayerIndex];
      curr.money = Math.max(0, curr.money - bribeAmount);
      curr.totalBribes += bribeAmount;
      curr.karma = Math.min(100, curr.karma + 25);
      return next;
    });

    setRecentLog(`${activePlayer.name} memakai pembukuan ganda bawah meja! Karma risiko naik +25%.`);
  };

  // Pay Bail out of Sukamiskin
  const handlePayBail = () => {
    if (!activePlayer || activePlayer.money < 2500000) return;
    if (isOnlineMode && !isMyTurnOnline) {
      soundManager.playBoing();
      return;
    }
    soundManager.playMoney();

    setPlayers((prev) => {
      const next = [...prev];
      const curr = next[activePlayerIndex];
      curr.money -= 2500000;
      curr.inJail = false;
      curr.jailTurns = 0;
      return next;
    });

    if (multiplayerRoom) {
      multiplayerService.sendAction({
        type: 'PAY_BAIL',
        amount: 2500000,
      });
    }

    setRecentLog(`${activePlayer.name} menyetor uang damai Rp 2.500.000 dan bebas dari Sukamiskin!`);
  };

  // Donate Charity to reduce Karma
  const handleDonateCharity = () => {
    if (!karmaModalPlayer) return;
    const targetIdx = players.findIndex((p) => p.id === karmaModalPlayer.id);
    if (targetIdx === -1 || players[targetIdx].money < 2000000) return;

    setPlayers((prev) => {
      const next = [...prev];
      next[targetIdx] = {
        ...next[targetIdx],
        money: next[targetIdx].money - 2000000,
        karma: Math.max(0, next[targetIdx].karma - 15),
      };
      setKarmaModalPlayer(next[targetIdx]);
      return next;
    });

    setArisanPot((prev) => prev + 1000000);
    setRecentLog(`🕊️ ${karmaModalPlayer.name} bersedekah Rp 2.000.000 ke kas warga! Dosa Karma berkurang -15%.`);
  };

  // Trigger Game Over with reason, celebration fanfare, and leaderboard
  const triggerGameOver = (
    winner: Player,
    reason: 'ELIMINATION' | 'TARGET_REACHED' | 'ROUNDS_COMPLETED',
    rounds: number
  ) => {
    setGameState('GAME_OVER');
    setGameOverData({
      winner,
      reason,
      totalRounds: rounds,
    });
    soundManager.playFanfare();
    confetti({ particleCount: 150, spread: 90 });

    const newRecord: LeaderboardRecord = {
      id: `rec_${Date.now()}`,
      name: winner.name,
      role: winner.accessory,
      characterEmoji: winner.avatarEmoji,
      netWorth: calculateNetWorth(winner),
      totalBribes: winner.totalBribes,
      category: winner.totalBribes > 30000000 ? 'KORUPTOR' : 'SULTAN',
      statusNote:
        reason === 'TARGET_REACHED'
          ? 'Mencapai target kekayaan fantastis Rp 100 Juta!'
          : reason === 'ROUNDS_COMPLETED'
          ? `Juara terkaya setelah ${rounds} putaran!`
          : 'Berhasil menyingkirkan seluruh lawan hingga bangkrut total.',
      date: new Date().toISOString().split('T')[0],
    };
    saveLeaderboard([newRecord, ...leaderboard]);

    setViralNews({
      player: winner,
      data: {
        type: 'BECOME_SULTAN',
        headline: `PENOBATAN SULTAN BARU: ${winner.name} Kuasai Monopoli RI!`,
        subheadline:
          reason === 'TARGET_REACHED'
            ? 'Tembus Kekayaan Bersih Rp 100 Juta Pertama!'
            : reason === 'ROUNDS_COMPLETED'
            ? `Pemenang Tertinggi Setelah ${rounds} Ronde!`
            : 'Seluruh Pesaing Pailit dan Mengibarkan Bendera Putih',
        story: `Dengan kelihaian berinvestasi, lobi proyek, dan manajemen risiko yang matang, ${winner.name} resmi dinyatakan sebagai Sultan Tertinggi di Simulator Warga62!`,
        quoteWarga: 'Memang auranya sudah aura konglomerat sejak awal.',
      },
    });
  };

  // End Turn
  const handleEndTurn = () => {
    if (!activePlayer) return;
    if (isOnlineMode && !isMyTurnOnline) {
      soundManager.playBoing();
      return;
    }

    // 1. Check if player has served jail turn
    if (activePlayer.inJail) {
      soundManager.playGavel();
      const remainingTurns = activePlayer.jailTurns - 1;
      setPlayers((prev) => {
        const next = [...prev];
        const curr = next[activePlayerIndex];
        curr.jailTurns = remainingTurns;
        if (remainingTurns <= 0) {
          curr.inJail = false;
          curr.jailTurns = 0;
        }
        return next;
      });

      if (remainingTurns <= 0) {
        setRecentLog(`🎉 Masa hukuman selesai! ${activePlayer.name} resmi BEBAS dari Lapas Sukamiskin.`);
      } else {
        setRecentLog(`⛓️ ${activePlayer.name} menjalani 1 giliran di Sukamiskin (${remainingTurns} giliran tersisa).`);
      }
    }

    // 2. Advance Economic cycle countdown
    const nextCountdown = economicTurnCountdown - 1;
    if (nextCountdown <= 0) {
      const nextEconomicIdx = (economicIndex + 1) % ECONOMIC_CONDITIONS.length;
      setEconomicIndex(nextEconomicIdx);
      setEconomicTurnCountdown(5);
      setRecentLog(`⚠️ Dinamika Ekonomi Berganti: ${ECONOMIC_CONDITIONS[nextEconomicIdx].title}!`);
    } else {
      setEconomicTurnCountdown(nextCountdown);
    }

    // 3. Check Game Over conditions
    const activeSurvivors = players.filter((p) => !p.isBankrupt);

    // Condition A: Elimination (Only 1 non-bankrupt survivor left)
    if (activeSurvivors.length <= 1) {
      const winner = activeSurvivors[0] || players[0];
      triggerGameOver(winner, 'ELIMINATION', roundCount);
      return;
    }

    // Condition B: Net Worth Target reached (Rp 100 Juta)
    for (const p of activeSurvivors) {
      if (calculateNetWorth(p) >= 100000000) {
        triggerGameOver(p, 'TARGET_REACHED', roundCount);
        return;
      }
    }

    // Condition C: Rounds limit completed (30 rounds)
    if (roundCount >= 30) {
      const sorted = [...activeSurvivors].sort(
        (a, b) => calculateNetWorth(b) - calculateNetWorth(a)
      );
      triggerGameOver(sorted[0], 'ROUNDS_COMPLETED', roundCount);
      return;
    }

    // 4. Next active player (with loop-guard to avoid infinite while loops)
    let nextIdx = (activePlayerIndex + 1) % players.length;
    let loopGuard = 0;
    while (players[nextIdx].isBankrupt && loopGuard < players.length) {
      nextIdx = (nextIdx + 1) % players.length;
      loopGuard++;
    }

    // Round counter updates when cycling back to index 0
    let nextRound = roundCount;
    if (nextIdx === 0) {
      nextRound = roundCount + 1;
      setRoundCount(nextRound);
      setRecentLog(`🔔 Putaran ke-${nextRound}/30 dimulai! Persaingan semakin panas.`);
    }

    setActivePlayerIndex(nextIdx);
    setHasRolled(false);
    setRecentLog(`Giliran beralih ke ${players[nextIdx].name}.`);

    if (multiplayerRoom) {
      multiplayerService.sendAction({
        type: 'END_TURN',
        nextPlayerIndex: nextIdx,
        roundCount: nextRound,
      });
    }
  };

  // Reset Game
  const handleResetGame = () => {
    setGameState('SETUP');
    setTiles(INITIAL_BOARD_TILES);
    setArisanPot(6500000);
    setEconomicIndex(0);
    setEconomicTurnCountdown(5);
    setRoundCount(1);
    setGameOverData(null);
    setMultiplayerRoom(null);
    setMyOnlinePlayerId(null);
    multiplayerService.disconnect();
    setRecentLog('Permainan direset.');
  };

  // Load Game Progress from Cloud or Local Storage
  const handleLoadGame = (data: GameSaveData) => {
    setPlayers(data.players);
    setTiles(data.tiles);
    setActivePlayerIndex(data.current_player_index);
    setRoundCount(data.round_count);
    setArisanPot(data.arisan_pot);
    setEconomicIndex(data.economic_index);
    setEconomicTurnCountdown(data.economic_turn_countdown);
    setGameState('PLAYING');
    setHasRolled(false);
    setGameOverData(null);
    setRecentLog(`📂 Progres permainan berhasil dimuat (Kode: ${data.save_code})!`);
  };

  return (
    <div className="min-h-screen bg-[#f7eed9] text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Bar (strict 3-zone contract) */}
      <TopBar
        isMuted={isMuted}
        onToggleAudio={handleToggleAudio}
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
        onOpenRules={() => setRulesOpen(true)}
        onOpenSaveLoad={() => setSaveLoadModalOpen(true)}
        onOpenMultiplayer={() => setOnlineLobbyOpen(true)}
        onOpenFeedback={() => setFeedbackModalOpen(true)}
        multiplayerRoomCode={multiplayerRoom?.code}
        onResetGame={handleResetGame}
        inGame={gameState === 'PLAYING'}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-5 flex flex-col items-center">
        {gameState === 'SETUP' ? (
          <CharacterCustomizer
            onStartGame={handleStartGame}
            onOpenSaveLoad={() => setSaveLoadModalOpen(true)}
            onOpenOnlineMultiplayer={() => setOnlineLobbyOpen(true)}
            onOpenFeedback={() => setFeedbackModalOpen(true)}
          />
        ) : (
          <div className="w-full space-y-4">
            {/* Round & Victory Target Status Banner */}
            <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 p-2.5 px-4 rounded-2xl border-2 border-slate-900 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-slate-950 text-yellow-300 font-black font-comic text-xs rounded-full uppercase tracking-wider">
                  Putaran {roundCount}/30
                </span>
                <span className="text-xs font-black text-slate-950 font-comic">
                  🏆 Syarat Menang: Jadi Sultan Rp 100 Jt atau Singkirkan Seluruh Lawan Hingga Bangkrut!
                </span>
              </div>
              <button
                onClick={() => setRulesOpen(true)}
                className="text-[11px] font-bold text-slate-900 underline hover:text-red-700 cursor-pointer"
              >
                Lihat Panduan & Syarat Menang
              </button>
            </div>

            {/* Dynamic Economy Ticker */}
            <EconomyTicker
              condition={currentEconomic}
              turnCountdown={economicTurnCountdown}
            />

            {/* Players Status Overview Bar (Spacious cards with NO text cutoff) */}
            <PlayersOverviewBar
              players={players}
              activePlayer={activePlayer}
              tiles={tiles}
              onOpenKarmaInfo={(p) => setKarmaModalPlayer(p)}
              myOnlinePlayerId={currentMyId}
            />

            {/* Board & Side HUD layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Game Board (Left / Main area) */}
              <div className="lg:col-span-8 flex justify-center">
                <GameBoard
                  tiles={tiles}
                  players={players}
                  activePlayer={activePlayer}
                  economic={currentEconomic}
                  arisanPot={arisanPot}
                  diceRoll={diceRoll}
                  isRolling={isRolling}
                  isHopping={isHopping}
                  onTileClick={(tile) => setInspectedTile(tile)}
                  recentLog={recentLog}
                  hoppingPlayerId={hoppingPlayerId}
                  stepHighlightedTileId={stepHighlightedTileId}
                  liquidatingTileIds={liquidatingTileIds}
                  startBonusNotification={startBonusPopup}
                />
              </div>

              {/* Player Controls & Turn HUD (Right side) */}
              <div className="lg:col-span-4 w-full">
                <PlayerHUD
                  players={players}
                  activePlayer={activePlayer}
                  tiles={tiles}
                  currentTile={currentTile}
                  canRoll={!hasRolled && !isRolling && !isHopping && !activePlayer.inJail && isMyTurnOnline}
                  canEndTurn={(hasRolled || activePlayer.inJail) && !isRolling && !isHopping && isMyTurnOnline}
                  canBuyProperty={
                    hasRolled &&
                    !isRolling &&
                    !isHopping &&
                    (currentTile.type === 'property' || currentTile.type === 'bumn') &&
                    !currentTile.ownerId &&
                    isMyTurnOnline
                  }
                  canUpgradeProperty={
                    currentTile.type === 'property' &&
                    currentTile.ownerId === activePlayer.id &&
                    currentTile.houses < 3 &&
                    !isHopping &&
                    isMyTurnOnline
                  }
                  onRollDice={() => handleRollDice()}
                  onEndTurn={handleEndTurn}
                  onBuyProperty={handleBuyProperty}
                  onOpenCorruption={() => setCorruptionModalOpen(true)}
                  onOpenSabotage={() => setSabotageModalOpen(true)}
                  onPayBail={handlePayBail}
                  onOpenTileDetail={() => setInspectedTile(currentTile)}
                  onOpenTileClick={(t) => setInspectedTile(t)}
                  onOpenKarmaInfo={(p) => setKarmaModalPlayer(p)}
                  isRolling={isRolling}
                  isHopping={isHopping}
                  diceRoll={diceRoll}
                  isOnlineMode={isOnlineMode}
                  isMyTurnOnline={isMyTurnOnline}
                  myOnlinePlayer={myOnlinePlayer}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-300 bg-amber-100/50 py-3 px-4 text-center text-xs text-slate-600 font-medium flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span>Simulator Warga62 © 2026 · Game Monopoli Satir Kehidupan Nyata Indonesia</span>
        <button
          onClick={() => setFeedbackModalOpen(true)}
          className="text-amber-900 font-bold hover:text-red-700 underline flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>📮 Kotak Aduan & Request Fitur</span>
        </button>
      </footer>

      {/* MODALS */}
      {/* 1. Tile Inspector */}
      {inspectedTile && (
        <TileDetailModal
          tile={inspectedTile}
          players={players}
          economic={currentEconomic}
          onClose={() => setInspectedTile(null)}
          onUpgrade={(id) => handleUpgradeProperty(id)}
          onSellProperty={(id) => handleSellProperty(id)}
          activePlayer={activePlayer}
          isOnlineMode={isOnlineMode}
          isMyTurnOnline={isMyTurnOnline}
          myOnlinePlayerId={currentMyId}
        />
      )}

      {/* 2. Corruption / Birokrasi Bawah Meja Modal */}
      {corruptionModalOpen && activePlayer && (
        <CorruptionModal
          player={activePlayer}
          economic={currentEconomic}
          onClose={() => setCorruptionModalOpen(false)}
          onCommitCorruption={handleCommitCorruption}
        />
      )}

      {/* 3. Sabotage & Joint Venture Modal */}
      {sabotageModalOpen && activePlayer && (
        <SabotageModal
          activePlayer={activePlayer}
          otherPlayers={players.filter((p) => p.id !== activePlayer.id && !p.isBankrupt)}
          tiles={tiles}
          onClose={() => setSabotageModalOpen(false)}
          onExecuteSabotage={handleExecuteSabotage}
          onProposeJointVentue={handleJointVenture}
        />
      )}

      {/* 4. Progressive Tax Modal */}
      {taxModalOpen && activePlayer && (
        <TaxModal
          player={activePlayer}
          netWorth={calculateNetWorth(activePlayer)}
          economic={currentEconomic}
          onPayHonest={handlePayHonestTax}
          onEvadeTax={handleEvadeTax}
        />
      )}

      {/* 5. Random Event Modal */}
      {eventCard && activePlayer && (
        <EventModal
          card={eventCard}
          player={activePlayer}
          onConfirm={handleConfirmEventCard}
        />
      )}

      {/* 6. Viral Newspaper / Social Share Modal */}
      {viralNews && (
        <ViralNewsModal
          player={viralNews.player}
          news={viralNews.data}
          onClose={() => setViralNews(null)}
        />
      )}

      {/* 7. Leaderboard Modal */}
      {leaderboardOpen && (
        <LeaderboardModal
          records={leaderboard}
          onClose={() => setLeaderboardOpen(false)}
        />
      )}

      {/* 8. Rules / Guide Modal */}
      {rulesOpen && (
        <RulesModal onClose={() => setRulesOpen(false)} />
      )}

      {/* 9. Karma & KPK Risk Info Modal */}
      {karmaModalPlayer && (
        <KarmaInfoModal
          player={karmaModalPlayer}
          onClose={() => setKarmaModalPlayer(null)}
          onDonateCharity={handleDonateCharity}
        />
      )}

      {/* 10. Game Over Modal (Penobatan Sultan / Kemenangan) */}
      {gameState === 'GAME_OVER' && gameOverData && (
        <GameOverModal
          winner={gameOverData.winner}
          players={players}
          tiles={tiles}
          reason={gameOverData.reason}
          totalRounds={gameOverData.totalRounds}
          onRestart={handleResetGame}
          onOpenLeaderboard={() => setLeaderboardOpen(true)}
        />
      )}

      {/* 11. Liquidation Effect Modal (Burning Paper & Free Fall Animation) */}
      {liquidatingPropsModal && (
        <LiquidationEffectModal
          playerName={liquidatingPropsModal.playerName}
          playerAvatar={liquidatingPropsModal.playerAvatar}
          properties={liquidatingPropsModal.properties}
          isTotalBankruptcy={liquidatingPropsModal.isTotalBankruptcy}
          totalCashRecovered={liquidatingPropsModal.totalCashRecovered}
          onComplete={() => setLiquidatingPropsModal(null)}
        />
      )}

      {/* 12. Floating START Salary Notification Popup on Viewport */}
      {startBonusPopup && (
        <div
          key={`viewport-start-${startBonusPopup.id}`}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-slide-up-float"
        >
          <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl border-2 sm:border-3 border-slate-950 shadow-2xl flex items-center gap-2.5 sm:gap-3 comic-box-sm animate-pulse-glow">
            <span className="text-2xl sm:text-3xl animate-bounce">💵</span>
            <div className="text-left">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-black font-comic text-yellow-300 drop-shadow-sm whitespace-nowrap">
                  {startBonusPopup.text}
                </span>
                <span className="text-[9px] bg-emerald-950 text-emerald-200 px-1.5 py-0.2 rounded font-mono font-bold uppercase">
                  PETAK START
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-100 font-bold leading-tight">
                {startBonusPopup.playerName} ({startBonusPopup.subtext || 'Gaji Pokok WNI'})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 13. Save / Load Progress Modal (Supabase Cloud + Local Backup) */}
      <SaveLoadModal
        isOpen={saveLoadModalOpen}
        onClose={() => setSaveLoadModalOpen(false)}
        gameState={{
          players,
          tiles,
          roundCount,
          activePlayerIndex,
          arisanPot,
          economicIndex,
          economicTurnCountdown,
        }}
        onLoadGame={handleLoadGame}
      />

      {/* 14. Online Multiplayer Room Lobby Modal */}
      <OnlineLobbyModal
        isOpen={onlineLobbyOpen}
        onClose={() => setOnlineLobbyOpen(false)}
        onStartMultiplayerGame={(room, roomPlayers) => {
          handleStartMultiplayerGame(room, roomPlayers);
          setOnlineLobbyOpen(false);
        }}
      />

      {/* 15. Online Chat Drawer (Real-Time in-game chat) */}
      {multiplayerRoom && gameState === 'PLAYING' && (
        <OnlineChatDrawer
          messages={onlineChatMessages}
          currentUserName={activePlayer?.name || 'Warga'}
          currentUserAvatar={activePlayer?.avatarEmoji || '🇮🇩'}
          currentUserColor={activePlayer?.color || '#0284c7'}
        />
      )}

      {/* 16. Dynamic 3D Dice Roll & Reveal Overlay */}
      <DiceRollOverlay state={diceOverlayState} />

      {/* 17. Citizen Feedback & Bug Report Modal */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        currentUserName={activePlayer?.name || 'Warga 62'}
        roundCount={roundCount}
        multiplayerRoomCode={multiplayerRoom?.code}
      />
    </div>
  );
}
