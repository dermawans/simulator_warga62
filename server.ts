import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ClientMeta {
  ws: WebSocket;
  roomId?: string;
  playerId?: string;
}

interface RoomPlayer {
  id: string;
  name: string;
  avatarEmoji: string;
  color: string;
  accessory: string;
  quote: string;
  isHost: boolean;
  isReady: boolean;
  connected: boolean;
}

interface ServerRoom {
  code: string;
  hostId: string;
  status: 'LOBBY' | 'PLAYING' | 'ENDED';
  players: RoomPlayer[];
  maxPlayers: number;
  createdAt: number;
  gameState?: any;
}

const rooms = new Map<string, ServerRoom>();
const clients = new Map<WebSocket, ClientMeta>();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health and info check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      activeRooms: rooms.size,
      connectedClients: clients.size,
      uptime: process.uptime(),
    });
  });

  // Get public room info
  app.get('/api/rooms/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({
      code: room.code,
      status: room.status,
      playerCount: room.players.length,
      maxPlayers: room.maxPlayers,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatarEmoji: p.avatarEmoji,
        color: p.color,
        isHost: p.isHost,
        isReady: p.isReady,
      })),
    });
  });

  // WebSocket Server on /ws
  const wss = new WebSocketServer({ server, path: '/ws' });

  function broadcastToRoom(roomCode: string, payload: any, excludeWs?: WebSocket) {
    const message = JSON.stringify(payload);
    for (const [ws, meta] of clients.entries()) {
      if (meta.roomId === roomCode && ws.readyState === WebSocket.OPEN && ws !== excludeWs) {
        ws.send(message);
      }
    }
  }

  wss.on('connection', (ws: WebSocket) => {
    clients.set(ws, { ws });

    ws.on('message', (data: Buffer | string) => {
      try {
        const parsed = JSON.parse(data.toString());
        const { type, payload } = parsed;
        const meta = clients.get(ws);
        if (!meta) return;

        switch (type) {
          case 'ROOM_JOIN': {
            const { code, player, maxPlayers = 4 } = payload;
            const roomCode = (code || '').trim().toUpperCase();
            if (!roomCode || !player) return;

            let room = rooms.get(roomCode);
            if (!room) {
              // Create new room if doesn't exist
              room = {
                code: roomCode,
                hostId: player.id,
                status: 'LOBBY',
                players: [],
                maxPlayers: Math.min(4, Math.max(2, maxPlayers)),
                createdAt: Date.now(),
              };
              rooms.set(roomCode, room);
            }

            // Check if room is full
            const existingPlayerIndex = room.players.findIndex((p) => p.id === player.id);
            if (existingPlayerIndex === -1 && room.players.length >= room.maxPlayers) {
              ws.send(
                JSON.stringify({
                  type: 'ERROR',
                  payload: { message: `Room ${roomCode} sudah penuh (maksimal ${room.maxPlayers} pemain).` },
                })
              );
              return;
            }

            // Update client metadata
            meta.roomId = roomCode;
            meta.playerId = player.id;

            const newPlayer: RoomPlayer = {
              id: player.id,
              name: player.name,
              avatarEmoji: player.avatarEmoji,
              color: player.color,
              accessory: player.accessory || '',
              quote: player.quote || '',
              isHost: room.hostId === player.id,
              isReady: room.hostId === player.id, // Host is ready by default
              connected: true,
            };

            if (existingPlayerIndex >= 0) {
              room.players[existingPlayerIndex] = {
                ...room.players[existingPlayerIndex],
                ...newPlayer,
                connected: true,
              };
            } else {
              room.players.push(newPlayer);
            }

            // Acknowledge join to current player
            ws.send(
              JSON.stringify({
                type: 'ROOM_JOINED',
                payload: { room, yourId: player.id },
              })
            );

            // Broadcast room update to other players in the room
            broadcastToRoom(roomCode, {
              type: 'ROOM_UPDATED',
              payload: { room },
            });
            break;
          }

          case 'ROOM_TOGGLE_READY': {
            if (!meta.roomId || !meta.playerId) return;
            const room = rooms.get(meta.roomId);
            if (!room) return;

            const player = room.players.find((p) => p.id === meta.playerId);
            if (player && !player.isHost) {
              player.isReady = !player.isReady;
              broadcastToRoom(meta.roomId, {
                type: 'ROOM_UPDATED',
                payload: { room },
              });
            }
            break;
          }

          case 'GAME_START': {
            if (!meta.roomId || !meta.playerId) return;
            const room = rooms.get(meta.roomId);
            if (!room || room.hostId !== meta.playerId) return;

            // Host starts the game
            room.status = 'PLAYING';
            if (payload?.gameState) {
              room.gameState = payload.gameState;
            }

            broadcastToRoom(meta.roomId, {
              type: 'GAME_STARTED',
              payload: { room, gameState: room.gameState },
            });
            break;
          }

          case 'GAME_ACTION': {
            if (!meta.roomId) return;
            const room = rooms.get(meta.roomId);
            if (!room) return;

            // Forward game action to all other players in the room
            broadcastToRoom(
              meta.roomId,
              {
                type: 'GAME_ACTION',
                payload: {
                  action: payload.action,
                  senderId: meta.playerId,
                  timestamp: Date.now(),
                },
              },
              ws
            );
            break;
          }

          case 'SYNC_STATE': {
            if (!meta.roomId) return;
            const room = rooms.get(meta.roomId);
            if (!room) return;

            room.gameState = payload.gameState;
            broadcastToRoom(
              meta.roomId,
              {
                type: 'STATE_SYNCED',
                payload: { gameState: room.gameState },
              },
              ws
            );
            break;
          }

          case 'CHAT_MESSAGE': {
            if (!meta.roomId) return;
            broadcastToRoom(meta.roomId, {
              type: 'CHAT_MESSAGE',
              payload: {
                message: payload.message,
              },
            });
            break;
          }

          case 'PING': {
            ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      const meta = clients.get(ws);
      if (meta && meta.roomId && meta.playerId) {
        const room = rooms.get(meta.roomId);
        if (room) {
          const player = room.players.find((p) => p.id === meta.playerId);
          if (player) {
            player.connected = false;
            // If in lobby and player disconnects, remove them; if playing, keep slot
            if (room.status === 'LOBBY') {
              room.players = room.players.filter((p) => p.id !== meta.playerId);
              // Reassign host if host left
              if (room.hostId === meta.playerId && room.players.length > 0) {
                room.hostId = room.players[0].id;
                room.players[0].isHost = true;
                room.players[0].isReady = true;
              }
            }

            if (room.players.length === 0) {
              rooms.delete(meta.roomId);
            } else {
              broadcastToRoom(meta.roomId, {
                type: 'ROOM_UPDATED',
                payload: { room },
              });
            }
          }
        }
      }
      clients.delete(ws);
    });
  });

  // Mount Vite middleware in development or static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Simulator Warga62] Server running on http://0.0.0.0:${PORT} (WS on /ws)`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
