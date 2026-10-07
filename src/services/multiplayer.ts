import { RoomPlayer, RoomState, MultiplayerAction, ChatMessage } from '../types/multiplayer';
import { getSupabaseClient, ensureConfigLoaded, isCloudConfigured } from '../utils/supabase';

type RoomUpdateListener = (room: RoomState) => void;
type GameStartListener = (room: RoomState, gameState: any) => void;
type GameActionListener = (action: MultiplayerAction, senderId: string) => void;
type ChatListener = (message: ChatMessage) => void;
type ErrorListener = (message: string) => void;
type StatusListener = (connected: boolean) => void;

class MultiplayerService {
  private ws: WebSocket | null = null;
  private currentRoomCode: string | null = null;
  private myPlayerId: string | null = null;
  private myPlayer: RoomPlayer | null = null;
  private isConnected: boolean = false;
  private isSimulationMode: boolean = false;
  private pingInterval: number | null = null;
  private currentRoomState: RoomState | null = null;

  // Supabase Realtime channel
  private supabaseChannel: any = null;

  // Listeners
  private roomUpdateListeners: Set<RoomUpdateListener> = new Set();
  private gameStartListeners: Set<GameStartListener> = new Set();
  private gameActionListeners: Set<GameActionListener> = new Set();
  private chatListeners: Set<ChatListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();

  public getCurrentPlayerId(): string | null {
    return this.myPlayerId;
  }

  public getCurrentRoomCode(): string | null {
    return this.currentRoomCode;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public getIsSimulationMode(): boolean {
    return this.isSimulationMode;
  }

  // Connect & Join Room
  public async joinRoom(
    roomCode: string,
    player: RoomPlayer,
    maxPlayers: number = 4,
    forceSimulation: boolean = false
  ) {
    const cleanCode = roomCode.trim().toUpperCase();
    this.currentRoomCode = cleanCode;
    this.myPlayerId = player.id;
    this.myPlayer = { ...player };
    this.disconnect();

    if (forceSimulation) {
      this.initSimulationRoom(cleanCode, player, maxPlayers);
      return;
    }

    // Try WebSocket first if available on origin
    let wsSuccess = false;
    try {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

      wsSuccess = await new Promise<boolean>((resolve) => {
        let settled = false;
        const testWs = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          if (!settled) {
            settled = true;
            try {
              testWs.close();
            } catch {}
            resolve(false);
          }
        }, 1800); // 1.8s fast probe for WebSocket

        testWs.onopen = () => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            this.ws = testWs;
            this.setupWebSocket(cleanCode, player, maxPlayers);
            resolve(true);
          }
        };

        testWs.onerror = () => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            try {
              testWs.close();
            } catch {}
            resolve(false);
          }
        };
      });
    } catch {
      wsSuccess = false;
    }

    if (wsSuccess) {
      return;
    }

    // Fallback to Supabase Realtime
    console.log('[Multiplayer] WebSocket not reachable. Switching to Supabase Realtime...');
    await this.initSupabaseRealtime(cleanCode, player, maxPlayers);
  }

  // 1. WebSocket Handler
  private setupWebSocket(roomCode: string, player: RoomPlayer, maxPlayers: number) {
    if (!this.ws) return;
    this.isConnected = true;
    this.isSimulationMode = false;
    this.notifyStatus(true);

    // Send JOIN packet
    this.send({
      type: 'ROOM_JOIN',
      payload: { code: roomCode, player, maxPlayers },
    });

    // Start keepalive ping
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'PING' });
      }
    }, 12000);

    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        this.handleMessage(parsed);
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.notifyStatus(false);
      this.cleanupPing();
    };

    this.ws.onerror = (err) => {
      console.warn('[Multiplayer WS Error]', err);
    };
  }

  // 2. Supabase Realtime Handler (Works in Serverless / Vercel / Cloud Run)
  private async initSupabaseRealtime(roomCode: string, player: RoomPlayer, maxPlayers: number) {
    await ensureConfigLoaded();

    const supabase = getSupabaseClient();
    if (!supabase || !isCloudConfigured()) {
      console.warn('[Multiplayer] Supabase not configured in client environment.');
      // Notify clear actionable error and offer Simulation Room fallback
      this.notifyError(
        'Server WebSocket dan Supabase belum terhubung. Pastikan VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY sudah disetel di Vercel Settings (tipe Config). Anda juga dapat mencoba "Mode Lobi Simulasi" di bawah!'
      );
      return;
    }

    try {
      const channelName = `warga62_room_${roomCode.toLowerCase()}`;
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: true },
          presence: { key: player.id },
        },
      });

      // Initial local state
      const initialRoom: RoomState = {
        code: roomCode,
        hostId: player.isHost ? player.id : '',
        status: 'LOBBY',
        players: [player],
        maxPlayers,
        createdAt: Date.now(),
      };
      this.currentRoomState = initialRoom;

      // Handle Presence Sync (Players in room)
      channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          const playersMap = new Map<string, RoomPlayer>();

          // Always ensure current player is present
          if (this.myPlayer) {
            playersMap.set(this.myPlayer.id, this.myPlayer);
          }

          Object.values(presenceState).forEach((presList: any) => {
            if (Array.isArray(presList)) {
              presList.forEach((pres: any) => {
                if (pres?.id) {
                  playersMap.set(pres.id, {
                    id: pres.id,
                    name: pres.name || 'Warga',
                    avatarEmoji: pres.avatarEmoji || '🇮🇩',
                    color: pres.color || '#0284c7',
                    accessory: pres.accessory || '',
                    quote: pres.quote || '',
                    isHost: Boolean(pres.isHost),
                    isReady: Boolean(pres.isReady),
                    connected: true,
                  });
                }
              });
            }
          });

          const currentPlayers = Array.from(playersMap.values());
          const hasHost = currentPlayers.some((p) => p.isHost);
          if (!hasHost && currentPlayers.length > 0) {
            currentPlayers[0].isHost = true;
          }

          const hostPlayer = currentPlayers.find((p) => p.isHost) || currentPlayers[0];

          this.currentRoomState = {
            code: roomCode,
            hostId: hostPlayer?.id || player.id,
            status: this.currentRoomState?.status || 'LOBBY',
            players: currentPlayers,
            maxPlayers,
            createdAt: this.currentRoomState?.createdAt || Date.now(),
          };

          this.notifyRoomUpdate(this.currentRoomState);
        })
        .on('broadcast', { event: 'game_action' }, (payload: any) => {
          if (payload?.payload?.action) {
            this.notifyGameAction(payload.payload.action, payload.payload.senderId);
          }
        })
        .on('broadcast', { event: 'chat' }, (payload: any) => {
          if (payload?.payload?.message) {
            this.notifyChat(payload.payload.message);
          }
        })
        .on('broadcast', { event: 'game_start' }, (payload: any) => {
          if (payload?.payload?.room) {
            if (this.currentRoomState) {
              this.currentRoomState.status = 'PLAYING';
            }
            this.notifyGameStart(payload.payload.room, payload.payload.gameState);
          }
        })
        .on('broadcast', { event: 'room_state' }, (payload: any) => {
          if (payload?.payload?.room) {
            this.currentRoomState = payload.payload.room;
            this.notifyRoomUpdate(payload.payload.room);
          }
        });

      channel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          this.isSimulationMode = false;
          this.notifyStatus(true);

          await channel.track({
            id: player.id,
            name: player.name,
            avatarEmoji: player.avatarEmoji,
            color: player.color,
            accessory: player.accessory,
            quote: player.quote,
            isHost: player.isHost,
            isReady: player.isReady,
          });

          // Instantly notify local lobby UI
          this.notifyRoomUpdate(this.currentRoomState || initialRoom);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Supabase Realtime] Channel subscription failed:', status);
          this.notifyError('Gagal menghubungkan ke room Supabase Realtime. Silakan coba lagi.');
        }
      });

      this.supabaseChannel = channel;
    } catch (err: any) {
      console.error('[Supabase Realtime Error]', err);
      this.notifyError(`Gagal menghubungkan ke room: ${err?.message || 'Koneksi gagal'}`);
    }
  }

  // 3. Local Simulation Room (Instant zero-barrier testing with friendly bots)
  public initSimulationRoom(roomCode: string, player: RoomPlayer, maxPlayers: number = 4) {
    this.disconnect();
    this.currentRoomCode = roomCode;
    this.myPlayerId = player.id;
    this.myPlayer = { ...player, isHost: true, isReady: true };
    this.isConnected = true;
    this.isSimulationMode = true;
    this.notifyStatus(true);

    const simulationPlayers: RoomPlayer[] = [
      this.myPlayer,
      {
        id: 'bot_rt_joko',
        name: 'Pak RT Joko',
        avatarEmoji: '👨‍💼',
        color: '#f59e0b',
        accessory: 'Kacamata Baca RT',
        quote: 'Warga rukun, kas aman!',
        isHost: false,
        isReady: true,
        connected: true,
      },
      {
        id: 'bot_bu_tejo',
        name: 'Bu Tejo Gosip',
        avatarEmoji: '🧕',
        color: '#ec4899',
        accessory: 'Tas Emas Arisan',
        quote: 'Duh jeng, tanah sebelah udah dibeli!',
        isHost: false,
        isReady: true,
        connected: true,
      },
    ];

    const simRoom: RoomState = {
      code: roomCode,
      hostId: player.id,
      status: 'LOBBY',
      players: simulationPlayers.slice(0, maxPlayers),
      maxPlayers,
      createdAt: Date.now(),
    };

    this.currentRoomState = simRoom;
    this.notifyRoomUpdate(simRoom);
  }

  private handleMessage(msg: { type: string; payload: any }) {
    const { type, payload } = msg;
    switch (type) {
      case 'ROOM_JOINED':
      case 'ROOM_UPDATED':
        if (payload?.room) {
          this.currentRoomState = payload.room;
          this.notifyRoomUpdate(payload.room);
        }
        break;
      case 'GAME_STARTED':
        if (payload?.room) {
          this.notifyGameStart(payload.room, payload.gameState);
        }
        break;
      case 'GAME_ACTION':
        if (payload?.action) {
          this.notifyGameAction(payload.action, payload.senderId);
        }
        break;
      case 'CHAT_MESSAGE':
        if (payload?.message) {
          this.notifyChat(payload.message);
        }
        break;
      case 'ERROR':
        if (payload?.message) {
          this.notifyError(payload.message);
        }
        break;
    }
  }

  // Client actions
  public toggleReady() {
    if (this.isSimulationMode && this.currentRoomState && this.myPlayer) {
      this.myPlayer.isReady = !this.myPlayer.isReady;
      const updatedPlayers = this.currentRoomState.players.map((p) =>
        p.id === this.myPlayerId ? { ...p, isReady: this.myPlayer!.isReady } : p
      );
      this.currentRoomState.players = updatedPlayers;
      this.notifyRoomUpdate({ ...this.currentRoomState });
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: 'ROOM_TOGGLE_READY' });
      return;
    }

    if (this.supabaseChannel && this.myPlayer) {
      this.myPlayer.isReady = !this.myPlayer.isReady;
      this.supabaseChannel.track({
        ...this.myPlayer,
      });
      if (this.currentRoomState) {
        const updated = this.currentRoomState.players.map((p) =>
          p.id === this.myPlayerId ? { ...p, isReady: this.myPlayer!.isReady } : p
        );
        this.currentRoomState.players = updated;
        this.notifyRoomUpdate({ ...this.currentRoomState });
      }
    }
  }

  public startGame(gameState: any) {
    if (this.isSimulationMode && this.currentRoomState) {
      this.currentRoomState.status = 'PLAYING';
      this.notifyGameStart({ ...this.currentRoomState }, gameState);
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'GAME_START',
        payload: { gameState },
      });
    }

    if (this.supabaseChannel && this.currentRoomState) {
      this.currentRoomState.status = 'PLAYING';
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'game_start',
        payload: { room: this.currentRoomState, gameState },
      });
    }
  }

  public sendAction(action: MultiplayerAction) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'GAME_ACTION',
        payload: { action },
      });
    }

    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'game_action',
        payload: { action, senderId: this.myPlayerId },
      });
    }
  }

  public sendChatMessage(text: string, sender: { name: string; avatar: string; color: string }) {
    const message: ChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: this.myPlayerId || '',
      senderName: sender.name,
      senderAvatar: sender.avatar,
      senderColor: sender.color,
      text: text.trim(),
      timestamp: Date.now(),
    };

    if (this.isSimulationMode) {
      this.notifyChat(message);
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'CHAT_MESSAGE',
        payload: { message },
      });
    }

    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'chat',
        payload: { message },
      });
    }
  }

  public disconnect() {
    this.cleanupPing();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    if (this.supabaseChannel) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) supabase.removeChannel(this.supabaseChannel);
      } catch {}
      this.supabaseChannel = null;
    }
    this.isConnected = false;
    this.isSimulationMode = false;
    this.currentRoomState = null;
    this.notifyStatus(false);
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private cleanupPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Listener subscriptions
  public onRoomUpdate(fn: RoomUpdateListener) {
    this.roomUpdateListeners.add(fn);
    return () => this.roomUpdateListeners.delete(fn);
  }

  public onGameStart(fn: GameStartListener) {
    this.gameStartListeners.add(fn);
    return () => this.gameStartListeners.delete(fn);
  }

  public onGameAction(fn: GameActionListener) {
    this.gameActionListeners.add(fn);
    return () => this.gameActionListeners.delete(fn);
  }

  public onChatMessage(fn: ChatListener) {
    this.chatListeners.add(fn);
    return () => this.chatListeners.delete(fn);
  }

  public onError(fn: ErrorListener) {
    this.errorListeners.add(fn);
    return () => this.errorListeners.delete(fn);
  }

  public onConnectionChange(fn: StatusListener) {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  // Notifiers
  private notifyRoomUpdate(room: RoomState) {
    this.roomUpdateListeners.forEach((fn) => fn(room));
  }

  private notifyGameStart(room: RoomState, gameState: any) {
    this.gameStartListeners.forEach((fn) => fn(room, gameState));
  }

  private notifyGameAction(action: MultiplayerAction, senderId: string) {
    this.gameActionListeners.forEach((fn) => fn(action, senderId));
  }

  private notifyChat(message: ChatMessage) {
    this.chatListeners.forEach((fn) => fn(message));
  }

  private notifyError(message: string) {
    this.errorListeners.forEach((fn) => fn(message));
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((fn) => fn(connected));
  }
}

export const multiplayerService = new MultiplayerService();
