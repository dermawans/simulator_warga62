import { Player, BoardTile } from './game';

export interface RoomPlayer {
  id: string;
  name: string;
  characterId?: string;
  avatarEmoji: string;
  color: string;
  accessory: string;
  quote: string;
  isHost: boolean;
  isReady: boolean;
  connected: boolean;
}

export interface RoomState {
  code: string;
  hostId: string;
  status: 'LOBBY' | 'PLAYING' | 'ENDED';
  players: RoomPlayer[];
  maxPlayers: number;
  createdAt: number;
  gameState?: {
    players: Player[];
    tiles: BoardTile[];
    activePlayerIndex: number;
    roundCount: number;
    arisanPot: number;
    economicIndex: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderColor: string;
  text: string;
  timestamp: number;
}

export type MultiplayerAction =
  | { type: 'ROLL_DICE'; dice: [number, number]; steps: number }
  | { type: 'BUY_PROPERTY'; tileId: number }
  | { type: 'UPGRADE_PROPERTY'; tileId: number; newHouses: number }
  | { type: 'SELL_PROPERTY'; tileId: number }
  | { type: 'END_TURN'; nextPlayerIndex: number; roundCount: number }
  | { type: 'PAY_BAIL'; amount: number }
  | { type: 'CORRUPTION'; schemeId: string; isBusted: boolean }
  | { type: 'SABOTAGE'; targetPlayerId: string; skillId: string }
  | { type: 'FULL_STATE_SYNC'; players: Player[]; tiles: BoardTile[]; activePlayerIndex: number; roundCount: number; arisanPot: number; economicIndex: number }
  | { type: 'CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'TAUNT'; senderName: string; emoji: string; text?: string }
  | { type: 'PLAYER_DISCONNECTED'; playerId: string; playerName?: string }
  | { type: 'PLAYER_TIMEOUT'; playerId: string; nextPlayerIndex: number; roundCount: number };
