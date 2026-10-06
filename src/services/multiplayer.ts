import { RoomPlayer, RoomState, MultiplayerAction, ChatMessage } from '../types/multiplayer';
import { getSupabaseClient, isCloudConfigured } from '../utils/supabase';

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
  private isConnected: boolean = false;
  private reconnectTimer: number | null = null;
  private pingInterval: number | null = null;

  // Supabase Realtime channel fallback
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

  // Connect & Join Room
  public joinRoom(roomCode: string, player: RoomPlayer, maxPlayers: number = 4) {
    this.currentRoomCode = roomCode.trim().toUpperCase();
    this.myPlayerId = player.id;

    // Disconnect existing if any
    this.disconnect();

    // 1. Try WebSocket connection to server (/ws)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notifyStatus(true);

        // Send JOIN
        this.send({
          type: 'ROOM_JOIN',
          payload: { code: this.currentRoomCode, player, maxPlayers },
        });

        // Start ping
        this.pingInterval = window.setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send({ type: 'PING' });
          }
        }, 15000);
      };

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
        console.warn('WebSocket connection issue, checking Supabase fallback...', err);
        // If Supabase is configured and WebSocket fails, initialize Supabase Realtime channel
        this.initSupabaseFallback(roomCode, player);
      };
    } catch {
      this.initSupabaseFallback(roomCode, player);
    }
  }

  // Supabase Realtime fallback
  private initSupabaseFallback(roomCode: string, player: RoomPlayer) {
    if (!isCloudConfigured()) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const channel = supabase.channel(`warga62_room_${roomCode.toLowerCase()}`, {
        config: { broadcast: { self: false }, presence: { key: player.id } },
      });

      channel
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
            this.notifyGameStart(payload.payload.room, payload.payload.gameState);
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.notifyStatus(true);
            channel.track({
              id: player.id,
              name: player.name,
              avatarEmoji: player.avatarEmoji,
              color: player.color,
              isHost: player.isHost,
            });
          }
        });

      this.supabaseChannel = channel;
    } catch (err) {
      console.error('Supabase fallback error:', err);
    }
  }

  private handleMessage(msg: { type: string; payload: any }) {
    const { type, payload } = msg;
    switch (type) {
      case 'ROOM_JOINED':
      case 'ROOM_UPDATED':
        if (payload?.room) {
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
    this.send({ type: 'ROOM_TOGGLE_READY' });
  }

  public startGame(gameState: any) {
    this.send({
      type: 'GAME_START',
      payload: { gameState },
    });

    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'game_start',
        payload: { room: { code: this.currentRoomCode, status: 'PLAYING' }, gameState },
      });
    }
  }

  public sendAction(action: MultiplayerAction) {
    this.send({
      type: 'GAME_ACTION',
      payload: { action },
    });

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

    this.send({
      type: 'CHAT_MESSAGE',
      payload: { message },
    });

    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'chat',
        payload: { message },
      });
    }
  }

  public syncFullState(gameState: any) {
    this.send({
      type: 'SYNC_STATE',
      payload: { gameState },
    });
  }

  public disconnect() {
    this.cleanupPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.supabaseChannel) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) supabase.removeChannel(this.supabaseChannel);
      } catch {
        // Ignore
      }
      this.supabaseChannel = null;
    }
    this.isConnected = false;
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
