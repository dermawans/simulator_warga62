import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Player,
  BoardTile,
  EconomicCondition,
  EventCard,
  LeaderboardRecord,
  SkillActivationInfo
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
import { SkillActivationOverlay } from './components/SkillActivationOverlay';
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
  const [doubleRollCount, setDoubleRollCount] = useState<number>(0);
  const [hasDoubleRollBonus, setHasDoubleRollBonus] = useState<boolean>(false);
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(60);
  const [activeSkillOverlay, setActiveSkillOverlay] = useState<SkillActivationInfo | null>(null);
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
  const pendingEventCardRef = useRef<EventCard | null>(null);
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
  const isHost = !multiplayerRoom || (multiplayerRoom.hostId === currentMyId);

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

  // 60-Second Turn Countdown Timer
  useEffect(() => {
    if (gameState !== 'PLAYING' || !!gameOverData || isHopping || isRolling) return;

    const timer = window.setInterval(() => {
      setTurnTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, gameOverData, isHopping, isRolling, activePlayerIndex]);

  // Turn Timeout (60s AFK) Auto-action Handler
  useEffect(() => {
    if (gameState !== 'PLAYING' || !activePlayer || !!gameOverData || isHopping || isRolling) return;
    if (turnTimeLeft !== 0) return;

    const isMyTurn = !isOnlineMode || isMyTurnOnline;
    const isHost = multiplayerRoom && multiplayerService.getCurrentPlayerId() === multiplayerRoom.hostId;

    if (isMyTurn) {
      setRecentLog(`⏱️ Waktu giliran ${activePlayer.name} habis (60s AFK)! Melanjutkan giliran otomatis...`);
      soundManager.playBoing();
      if (!hasRolled && !activePlayer.inJail) {
        handleRollDice();
      } else {
        handleEndTurn();
      }
    } else if (isHost) {
      // Host acts as authority to unfreeze room if remote player went AFK
      const hostTimer = window.setTimeout(() => {
        if (turnTimeLeft === 0 && !isHopping && !isRolling) {
          setRecentLog(`⏱️ Waktu giliran ${activePlayer.name} habis (60s AFK)! Host mengalihkan giliran agar match tidak macet.`);
          handleEndTurn();
        }
      }, 2000);
      return () => clearTimeout(hostTimer);
    }
  }, [turnTimeLeft, gameState, activePlayer, isHopping, isRolling, hasRolled, isOnlineMode, isMyTurnOnline, multiplayerRoom]);

  // Window beforeunload: Disconnect cleanly if player closes browser
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (multiplayerRoom && gameState === 'PLAYING') {
        multiplayerService.disconnect();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [multiplayerRoom, gameState]);

  // Trigger Dynamic Character Skill Activation Effect
  const triggerSkillActivation = (
    player: Player,
    skillData: {
      skillName: string;
      skillEffect: string;
      bonusText?: string;
      badgeEmoji?: string;
      soundType?: 'fanfare' | 'money' | 'siren' | 'boing' | 'powerup';
    }
  ) => {
    const preset = CHARACTER_PRESETS.find((p) => p.id === player.characterId);
    const info: SkillActivationInfo = {
      id: `skill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      playerId: player.id,
      playerName: player.name,
      playerAvatar: player.avatarEmoji,
      playerColor: player.color,
      characterId: player.characterId,
      characterRole: preset?.role || 'Warga Satir',
      skillName: skillData.skillName,
      skillEffect: skillData.skillEffect,
      quote: preset?.quote,
      bonusText: skillData.bonusText,
      badgeEmoji: skillData.badgeEmoji,
      soundType: skillData.soundType || 'powerup',
    };

    setActiveSkillOverlay(info);

    // Broadcast in multiplayer so all room members see the effect
    if (multiplayerRoom) {
      multiplayerService.sendAction({
        type: 'SKILL_ACTIVATED',
        skillEvent: info,
      });
    }
  };

  // Remote Multiplayer Listeners
  useEffect(() => {
    const unsubAction = multiplayerService.onGameAction((action, senderId) => {
      switch (action.type) {
        case 'ROLL_DICE': {
          pendingEventCardRef.current = null;
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
              const isDoubleRemote = validDice[0] === validDice[1];
              if (isDoubleRemote) {
                setHasDoubleRollBonus(true);
                setHasRolled(false);
                soundManager.playFanfare();
                setRecentLog(`🎉 DADU KEMBAR [${validDice[0]}, ${validDice[1]}]! ${roller.name} dapat giliran tambahan kocok dadu lagi!`);
              } else {
                setHasDoubleRollBonus(false);
                setHasRolled(true);
              }
              movePlayer(validSteps, isDoubleRemote);
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
          setHasDoubleRollBonus(false);
          setDoubleRollCount(0);
          setTurnTimeLeft(60);
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
            if (players[pIdx].characterId === 'pejabat') {
              const bonusCuan = Math.round(gain * 0.2);
              gain += bonusCuan;
              triggerSkillActivation(players[pIdx], {
                skillName: 'Koneksi Tender Dinas',
                skillEffect: 'Korupsi SPJ dinas menghasilkan cuan +20% lebih banyak berkat lobi birokrasi!',
                bonusText: `+${formatRupiah(bonusCuan)}`,
                badgeEmoji: '🧔🏻‍♂️',
                soundType: 'money',
              });
            }
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
            triggerSkillActivation(players[targetIdx], {
              skillName: 'Firewall Anti-Hacking',
              skillEffect: 'KEBAL SABOTASE! Serangan teror bisnis lawan berhasil dimentalkan tanpa kerugian!',
              bonusText: 'KEBAL SABOTASE 🛡️',
              badgeEmoji: '👩🏻‍💻',
              soundType: 'boing',
            });
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

        case 'SKILL_ACTIVATED': {
          setActiveSkillOverlay(action.skillEvent);
          break;
        }

        case 'EVENT_CARD_DRAWN': {
          pendingEventCardRef.current = action.card;
          if (!isHopping) {
            setEventCard(action.card);
          }
          break;
        }

        case 'EVENT_CARD_DODGED': {
          pendingEventCardRef.current = null;
          setEventCard(null);
          break;
        }

        case 'EVENT_CARD_CONFIRMED': {
          setPlayers((prev) => {
            const next = [...prev];
            const pIdx = action.playerIndex;
            if (pIdx >= 0 && pIdx < next.length) {
              const curr = { ...next[pIdx] };
              const moneyToAdd = action.card.id === 'win_arisan' ? 0 : action.card.moneyChange;
              curr.money = Math.max(0, curr.money + moneyToAdd);
              curr.karma = Math.max(0, Math.min(100, curr.karma + action.card.karmaChange));
              if (action.card.goToJail) {
                curr.inJail = true;
                curr.jailTurns = 3;
                curr.position = 24; // Lapas Sukamiskin
              }
              next[pIdx] = curr;
            }
            return next;
          });
          setRecentLog(`${players[action.playerIndex]?.name || 'Pemain'} menyelesaikan event: ${action.card.title}`);
          setEventCard(null);
          pendingEventCardRef.current = null;
          break;
        }

        case 'PAY_TAX': {
          setPlayers((prev) => {
            const next = [...prev];
            const pIdx = action.playerIndex;
            if (pIdx >= 0 && pIdx < next.length) {
              const curr = { ...next[pIdx] };
              curr.money = Math.max(0, curr.money - action.taxAmount);
              curr.totalTaxesPaid += action.taxAmount;
              if (action.isEvade) {
                if (action.isBusted) {
                  curr.inJail = true;
                  curr.jailTurns = 3;
                  curr.position = 24;
                  curr.karma = 10;
                } else {
                  curr.karma = Math.min(100, curr.karma + 25);
                }
              } else {
                curr.karma = Math.max(0, curr.karma - 15);
              }
              next[pIdx] = curr;
            }
            return next;
          });
          setTaxModalOpen(false);
          break;
        }
      }
    });

    const unsubChat = multiplayerService.onChatMessage((msg) => {
      // Security filter: Only accept chat from confirmed players in this active room
      if (multiplayerRoom) {
        const isMember = multiplayerRoom.players.some((p) => p.id === msg.senderId);
        if (!isMember) return;
      }
      setOnlineChatMessages((prev) => [...prev.slice(-25), msg]);
    });

    // Listen to Player Disconnect (Browser close / connection drop -> declare bankrupt)
    const unsubDisconnect = multiplayerService.onPlayerDisconnect((playerId, playerName) => {
      setPlayers((prev) => {
        const target = prev.find((p) => p.id === playerId);
        if (!target || target.isBankrupt) return prev;

        const next = prev.map((p) =>
          p.id === playerId ? { ...p, isBankrupt: true, money: 0 } : p
        );

        // Liquidate / free up all properties owned by disconnected player
        setTiles((tPrev) =>
          tPrev.map((t) => (t.ownerId === playerId ? { ...t, ownerId: null, houses: 0 } : t))
        );

        soundManager.playBoing();
        setRecentLog(`🔌 ${playerName || target.name} terputus / keluar dari game! Dinyatakan BANGKRUT & kalah.`);

        // Check if only 1 survivor left (Game Over)
        const survivors = next.filter((p) => !p.isBankrupt);
        if (survivors.length <= 1 && survivors.length > 0) {
          setTimeout(() => {
            triggerGameOver(survivors[0], 'ELIMINATION', roundCount);
          }, 600);
        } else if (prev[activePlayerIndex]?.id === playerId) {
          // If disconnected player was taking their turn, advance turn immediately!
          setTimeout(() => {
            handleEndTurn();
          }, 800);
        }

        return next;
      });
    });

    return () => {
      unsubAction();
      unsubChat();
      unsubDisconnect();
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

    // Check if any player has Bos Pinjol starting perk
    const pinjol = configuredPlayers.find((p) => p.characterId === 'bos_pinjol');
    if (pinjol) {
      setTimeout(() => {
        triggerSkillActivation(pinjol, {
          skillName: 'Dana Segar Bos Pinjol',
          skillEffect: 'Memulai permainan dengan modal kas awal ekstra Rp 5.000.000 (total modal awal Rp 25 Juta)!',
          bonusText: '+Rp 5.000.000 💵',
          badgeEmoji: '🤑',
          soundType: 'money',
        });
      }, 700);
    }
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

    // Check if any player has Bos Pinjol starting perk
    const pinjol = onlinePlayers.find((p) => p.characterId === 'bos_pinjol');
    if (pinjol) {
      setTimeout(() => {
        triggerSkillActivation(pinjol, {
          skillName: 'Dana Segar Bos Pinjol',
          skillEffect: 'Memulai permainan dengan modal kas awal ekstra Rp 5.000.000 (total modal awal Rp 25 Juta)!',
          bonusText: '+Rp 5.000.000 💵',
          badgeEmoji: '🤑',
          soundType: 'money',
        });
      }, 800);
    }
  };

  // Roll Dice & Move
  const handleRollDice = (customRoll?: any) => {
    if (isRolling || (!hasDoubleRollBonus && hasRolled) || isHopping || !activePlayer) return;
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
    const isDouble = d1 === d2;

    // Check consecutive double roll rule (3x in a row -> KPK investigation)
    if (isDouble && doubleRollCount >= 2) {
      soundManager.playSiren();
      setTimeout(() => soundManager.playGavel(), 400);
      setDoubleRollCount(0);
      setHasDoubleRollBonus(false);
      setHasRolled(true);
      setIsRolling(false);
      setRecentLog(`🚨 TERCYDUK KPK! ${activePlayer.name} kocok dadu kembar 3x berturut-turut (${d1} & ${d2})! Diciduk langsung ke Lapas Sukamiskin.`);
      setPlayers((prev) => {
        const next = [...prev];
        next[activePlayerIndex] = {
          ...next[activePlayerIndex],
          inJail: true,
          jailTurns: 3,
          position: 24, // Lapas Sukamiskin
        };
        return next;
      });
      return;
    }

    const nextDoubleCount = isDouble ? doubleRollCount + 1 : 0;
    setDoubleRollCount(nextDoubleCount);
    setHasDoubleRollBonus(isDouble);

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
        if (isDouble) {
          soundManager.playFanfare();
          setRecentLog(`🎉 DADU KEMBAR [${d1}, ${d2}]! ${activePlayer.name} berhak KELILING LAGI / KOCOK DADU SEKALI LAGI!`);
        }
        movePlayer(totalSteps, isDouble);
      }, 1100);
    }, 700);
  };

  const movePlayer = (steps: number, isDouble = false) => {
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
          triggerSkillActivation(activePlayer, {
            skillName: 'Tunjangan Magang Mahasiswa',
            skillEffect: 'Menerima ekstra tunjangan hidup +Rp 2.500.000 saat melintasi petak START!',
            bonusText: '+Rp 2.500.000 🎓',
            badgeEmoji: '🧑🏻‍🎓',
            soundType: 'money',
          });
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

          if (isDouble) {
            setHasRolled(false); // Enable rolling again!
            setHasDoubleRollBonus(true);
          } else {
            setHasRolled(true);
            setHasDoubleRollBonus(false);
          }

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
        const arisanBonus = Math.round(jackpot * 0.25);
        jackpot += arisanBonus;
        triggerSkillActivation(player, {
          skillName: 'Kocokan Bandar Sakti',
          skillEffect: 'Sebagai Bandar Arisan, Anda mendapat ekstra bonus cuan +25% dari seluruh kas warga!',
          bonusText: `+${formatRupiah(arisanBonus)} BONUS 🎁`,
          badgeEmoji: '💃🏻',
          soundType: 'fanfare',
        });
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

      const arisanCard: EventCard = {
        id: 'win_arisan',
        title: player.characterId === 'bandar_arisan' ? 'MENANG ARISAN + BONUS BANDAR! 🎁' : 'MENANG ARISAN WARGA RT! 🎁',
        category: 'ARISAN',
        description: 'Nama Anda keluar dari kocokan gelas arisan emak-emak komplek! Seluruh kas warga diserahkan kepada Anda.',
        effectDescription: `Uang tunai kas arisan bertambah +${formatRupiah(jackpot)}.`,
        moneyChange: 0,
        karmaChange: 0,
        isJackpot: true,
      };
      setEventCard(arisanCard);
      pendingEventCardRef.current = arisanCard;

      if (multiplayerRoom) {
        multiplayerService.sendAction({
          type: 'EVENT_CARD_DRAWN',
          card: arisanCard,
          playerIndex: activePlayerIndex,
        });
      }
      return;
    }

    if (tile.type === 'tax') {
      // Kantor Pajak Progresif
      soundManager.playGavel();
      if (!player.isBot) {
        if (!multiplayerRoom || currentMyId === player.id) {
          setTaxModalOpen(true);
        }
      } else {
        // Bot auto honest tax (only host executes for bots in multiplayer)
        if (!multiplayerRoom || isHost) {
          const netWorth = calculateNetWorth(player);
          let taxAmount = Math.round(netWorth * 0.03);
          if (player.characterId === 'emak_matic') {
            taxAmount = Math.round(taxAmount * 0.5);
            triggerSkillActivation(player, {
              skillName: 'Lobi Emak-Emak Matic',
              skillEffect: 'Diskon 50% pajak SPT tahunan lewat jurus tawar-menawar!',
              bonusText: 'DISKON 50%',
              badgeEmoji: '🧕🏼',
              soundType: 'money',
            });
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
          if (multiplayerRoom) {
            multiplayerService.sendAction({
              type: 'PAY_TAX',
              taxAmount,
              isEvade: false,
              isBusted: false,
              playerIndex: activePlayerIndex,
            });
          }
        }
      }
      return;
    }

    if (tileIndex === 16) {
      // Preman Parkir perk: collect Rp 1.000.000 instead of paying
      if (player.characterId === 'preman_parkir') {
        soundManager.playMoney();
        const setoran = 1000000;
        triggerSkillActivation(player, {
          skillName: 'Prit-Prit Setoran Parkir',
          skillEffect: 'Mengutip uang kas parkir liar Rp 1.000.000 dari kas warga bukannya membayar!',
          bonusText: '+Rp 1.000.000 🧢',
          badgeEmoji: '🧢',
          soundType: 'money',
        });
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
      const isAuthoritative =
        !multiplayerRoom || currentMyId === player.id || (player.isBot && isHost);

      if (!isAuthoritative) {
        // Remote multiplayer observer: do not roll an independent card!
        // Display card received from the active player who drew it
        if (pendingEventCardRef.current) {
          setEventCard(pendingEventCardRef.current);
        }
        return;
      }

      // Emak-Emak Matic perk: 50% chance to dodge razia police raid
      if (tileIndex === 20 && player.characterId === 'emak_matic' && Math.random() < 0.5) {
        soundManager.playFanfare();
        triggerSkillActivation(player, {
          skillName: 'Sen Kiri Belok Kanan',
          skillEffect: 'Lolos dari Razia Polisi Lalu Lintas tanpa ditilang berkat kepiawaian emak-emak!',
          bonusText: 'BEBAS TILANG 🛡️',
          badgeEmoji: '🧕🏼',
          soundType: 'fanfare',
        });
        setRecentLog(`🧕🏼 Sen Kiri Belok Kanan! ${player.name} berhasil lolos dari razia polisi lalu lintas tanpa kena tilang!`);
        if (multiplayerRoom) {
          multiplayerService.sendAction({
            type: 'EVENT_CARD_DODGED',
            playerIndex: activePlayerIndex,
          });
        }
        return;
      }

      // Random Event Card drawn by the active player / host
      let cardList = NASIB_CARDS;
      if (tileIndex === 20) {
        cardList = RAZIA_CARDS;
      } else if (tile.name.includes('KESEMPATAN')) {
        cardList = KESEMPATAN_CARDS;
      }
      const randomCard = cardList[Math.floor(Math.random() * cardList.length)];
      setEventCard(randomCard);
      pendingEventCardRef.current = randomCard;

      if (multiplayerRoom) {
        multiplayerService.sendAction({
          type: 'EVENT_CARD_DRAWN',
          card: randomCard,
          playerIndex: activePlayerIndex,
        });
      }
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
          triggerSkillActivation(player, {
            skillName: 'Koneksi Warga RT',
            skillEffect: 'Mendapat potongan sewa 30% berkat lobi rukun tetangga Pak RT!',
            bonusText: 'HEMAT 30% 👨🏻‍🦳',
            badgeEmoji: '👨🏻‍🦳',
            soundType: 'powerup',
          });
        }

        // Alvin SCBD perk: +25% rent in Jakarta & Jabodetabek
        const isJakselArea = tile.city === 'Jakarta' || tile.city === 'Jabodetabek' || tile.city === 'Tangerang' || tile.city === 'Bekasi' || tile.city === 'Depok' || tile.city === 'Bogor';
        if (owner.characterId === 'anak_jaksel' && isJakselArea) {
          const extraJaksel = Math.round(rent * 0.25);
          rent += extraJaksel;
          triggerSkillActivation(owner, {
            skillName: 'Gaya Hidup Senoparty',
            skillEffect: 'Tarif sewa naik +25% karena properti berada di kawasan elit Jabodetabek!',
            bonusText: `+${formatRupiah(extraJaksel)} ☕`,
            badgeEmoji: '👱🏼‍♂️',
            soundType: 'money',
          });
        }

        // Tuan Tanah Betawi perk: +15% extra rent on upgraded properties
        if (owner.characterId === 'tuan_tanah_betawi' && tile.houses > 0) {
          const extraBetawi = Math.round(rent * 0.15);
          rent += extraBetawi;
          triggerSkillActivation(owner, {
            skillName: 'Juragan Kontrakan 100 Pintu',
            skillEffect: 'Tarif sewa properti hasil renovasi bertambah ekstra +15%!',
            bonusText: `+${formatRupiah(extraBetawi)} 🧓🏾`,
            badgeEmoji: '🧓🏾',
            soundType: 'money',
          });
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
              triggerSkillActivation(owner, {
                skillName: 'Endorse Sultan Glowing',
                skillEffect: 'Menerima fee endorse Rp 500.000 dari brand kecantikan karena ada tamu mendarat!',
                bonusText: '+Rp 500.000 ✨',
                badgeEmoji: '✨',
                soundType: 'money',
              });
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
      triggerSkillActivation(activePlayer, {
        skillName: 'Proyek Strategis Nasional',
        skillEffect: 'Mendapat diskon PSN 20% saat membeli kavling properti baru atau aset BUMN!',
        bonusText: 'DISKON 20% 🎖️',
        badgeEmoji: '🎖️',
        soundType: 'powerup',
      });
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
      triggerSkillActivation(activePlayer, {
        skillName: 'Koneksi Tukang Borongan',
        skillEffect: 'Diskon 25% biaya renovasi properti berkat relasi tukang pangkalan ojol!',
        bonusText: 'HEMAT 25% 🛵',
        badgeEmoji: '🛵',
        soundType: 'powerup',
      });
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
        const bonusPejabat = Math.round(gain * 0.2);
        gain += bonusPejabat; // Pejabat perk: +20%
        triggerSkillActivation(activePlayer, {
          skillName: 'Koneksi Tender Dinas',
          skillEffect: 'Korupsi SPJ dinas menghasilkan cuan +20% lebih banyak berkat lobi birokrasi!',
          bonusText: `+${formatRupiah(bonusPejabat)} 💰`,
          badgeEmoji: '🧔🏻‍♂️',
          soundType: 'money',
        });
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

    // Check if target is Siti Hacker (programmer_scam)
    if (targetPlayer.characterId === 'programmer_scam') {
      soundManager.playBoing();
      triggerSkillActivation(targetPlayer, {
        skillName: 'Firewall Anti-Hacking',
        skillEffect: 'KEBAL SABOTASE! Serangan teror bisnis lawan berhasil dimentalkan tanpa kerugian!',
        bonusText: 'KEBAL SABOTASE 🛡️',
        badgeEmoji: '👩🏻‍💻',
        soundType: 'boing',
      });
      setRecentLog(`🛡️ Sabotase Gagal! ${targetPlayer.name} (Siti Hacker) kebal terhadap sabotase lawan!`);
      return;
    }

    if (activePlayer.characterId === 'programmer_scam') {
      triggerSkillActivation(activePlayer, {
        skillName: 'Bypass Server Darkweb',
        skillEffect: 'Diskon biaya sabotase Rp 1.000.000 dengan exploit script otomatis!',
        bonusText: 'HEMAT Rp 1.000.000 💻',
        badgeEmoji: '👩🏻‍💻',
        soundType: 'powerup',
      });
    }

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

    if (multiplayerRoom && currentMyId !== activePlayer.id && !(activePlayer.isBot && isHost)) {
      return;
    }

    setPlayers((prev) => {
      const next = [...prev];
      const curr = next[activePlayerIndex];
      const moneyToAdd = eventCard.id === 'win_arisan' ? 0 : eventCard.moneyChange;
      let newMoney = curr.money + moneyToAdd;
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

    if (multiplayerRoom) {
      multiplayerService.sendAction({
        type: 'EVENT_CARD_CONFIRMED',
        card: eventCard,
        playerIndex: activePlayerIndex,
      });
    }

    setEventCard(null);
    pendingEventCardRef.current = null;
  };

  // Honest tax payment
  const handlePayHonestTax = (taxAmount: number) => {
    if (!activePlayer) return;
    setTaxModalOpen(false);

    if (activePlayer.characterId === 'emak_matic') {
      triggerSkillActivation(activePlayer, {
        skillName: 'Lobi Emak-Emak Matic',
        skillEffect: 'Diskon 50% pembayaran SPT pajak progresif lewat keahlian menawar!',
        bonusText: 'HEMAT 50% 🧕🏼',
        badgeEmoji: '🧕🏼',
        soundType: 'money',
      });
    }

    setPlayers((prev) => {
      const next = [...prev];
      const curr = next[activePlayerIndex];
      curr.money = Math.max(0, curr.money - taxAmount);
      curr.totalTaxesPaid += taxAmount;
      curr.karma = Math.max(0, curr.karma - 15);
      return next;
    });

    setRecentLog(`${activePlayer.name} membayar SPT resmi ${formatRupiah(taxAmount)}. Karma berkurang!`);

    if (multiplayerRoom) {
      multiplayerService.sendAction({
        type: 'PAY_TAX',
        taxAmount,
        isEvade: false,
        isBusted: false,
        playerIndex: activePlayerIndex,
      });
    }
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

    if (multiplayerRoom) {
      multiplayerService.sendAction({
        type: 'PAY_TAX',
        taxAmount: bribeAmount,
        isEvade: true,
        isBusted: false,
        playerIndex: activePlayerIndex,
      });
    }
  };

  // Pay Bail out of Sukamiskin
  const handlePayBail = () => {
    const isHotmam = activePlayer?.characterId === 'pengacara_sultan';
    const bailCost = isHotmam ? 1250000 : 2500000;
    if (!activePlayer || activePlayer.money < bailCost) return;
    if (isOnlineMode && !isMyTurnOnline) {
      soundManager.playBoing();
      return;
    }
    soundManager.playMoney();

    if (isHotmam) {
      triggerSkillActivation(activePlayer, {
        skillName: 'Lobi Hukum Hotmam',
        skillEffect: 'Diskon 50% uang damai sipir Sukamiskin (cukup Rp 1.250.000) dan langsung bebas seketika!',
        bonusText: 'HEMAT 50% ⚖️',
        badgeEmoji: '⚖️',
        soundType: 'fanfare',
      });
    }

    setPlayers((prev) => {
      const next = [...prev];
      const curr = next[activePlayerIndex];
      curr.money -= bailCost;
      curr.inJail = false;
      curr.jailTurns = 0;
      return next;
    });

    if (multiplayerRoom) {
      multiplayerService.sendAction({
        type: 'PAY_BAIL',
        amount: bailCost,
      });
    }

    setRecentLog(`${activePlayer.name} menyetor uang damai ${formatRupiah(bailCost)} dan bebas dari Sukamiskin!`);
  };

  // Donate Charity to reduce Karma
  const handleDonateCharity = () => {
    if (!karmaModalPlayer) return;
    const targetIdx = players.findIndex((p) => p.id === karmaModalPlayer.id);
    if (targetIdx === -1 || players[targetIdx].money < 2000000) return;

    const isUstadz = karmaModalPlayer.characterId === 'ustadz_kondang';
    const karmaReduction = isUstadz ? 30 : 15;

    if (isUstadz) {
      triggerSkillActivation(karmaModalPlayer, {
        skillName: 'Sedekah Penggugur Dosa',
        skillEffect: 'Pahala berlipat! Karma KPK berkurang 2x lebih banyak (-30%)!',
        bonusText: '-30% KARMA 🕊️',
        badgeEmoji: '👳🏽‍♂️',
        soundType: 'fanfare',
      });
    }

    setPlayers((prev) => {
      const next = [...prev];
      next[targetIdx] = {
        ...next[targetIdx],
        money: next[targetIdx].money - 2000000,
        karma: Math.max(0, next[targetIdx].karma - karmaReduction),
      };
      setKarmaModalPlayer(next[targetIdx]);
      return next;
    });

    setArisanPot((prev) => prev + 1000000);
    setRecentLog(`🕊️ ${karmaModalPlayer.name} bersedekah Rp 2.000.000 ke kas warga! Dosa Karma berkurang -${karmaReduction}%.`);
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

    // Condition C: Rounds limit completed (50 rounds)
    if (roundCount >= 50) {
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
      setRecentLog(`🔔 Putaran ke-${nextRound}/50 dimulai! Persaingan semakin panas.`);
    }

    setActivePlayerIndex(nextIdx);
    setHasRolled(false);
    setHasDoubleRollBonus(false);
    setDoubleRollCount(0);
    setTurnTimeLeft(60);
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
            <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 p-2.5 px-3 sm:px-4 rounded-2xl border-2 border-slate-900 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-slate-950 text-yellow-300 font-black font-comic text-xs rounded-full uppercase tracking-wider">
                  Putaran {roundCount}/50
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
              currentRound={roundCount}
              maxRounds={50}
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
                  canRoll={(!hasRolled || hasDoubleRollBonus) && !isRolling && !isHopping && !activePlayer.inJail && isMyTurnOnline}
                  canEndTurn={!hasDoubleRollBonus && (hasRolled || activePlayer.inJail) && !isRolling && !isHopping && isMyTurnOnline}
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
                  isDoubleRoll={hasDoubleRollBonus}
                  turnTimeLeft={turnTimeLeft}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-300 bg-amber-100/50 py-3 px-4 text-center text-xs text-slate-600 font-medium flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span>Simulator Warga62 © 2026 · Game Monopoli</span>
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
          canConfirm={!multiplayerRoom || currentMyId === activePlayer.id || (activePlayer.isBot && isHost)}
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
          currentUserId={myOnlinePlayer?.id || currentMyId || ''}
          currentUserName={myOnlinePlayer?.name || 'Warga'}
          currentUserAvatar={myOnlinePlayer?.avatarEmoji || '🇮🇩'}
          currentUserColor={myOnlinePlayer?.color || '#0284c7'}
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

      {/* 18. Special Character Skill Activation Overlay */}
      <SkillActivationOverlay
        info={activeSkillOverlay}
        onDismiss={() => setActiveSkillOverlay(null)}
      />
    </div>
  );
}
