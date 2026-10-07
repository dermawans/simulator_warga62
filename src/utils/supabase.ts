import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Player, BoardTile } from '../types/game';

export interface GameSaveData {
  save_code: string;
  game_name: string;
  round_count: number;
  current_player_index: number;
  players: Player[];
  tiles: BoardTile[];
  arisan_pot: number;
  economic_index: number;
  economic_turn_countdown: number;
  saved_at?: string;
}

const LOCAL_STORAGE_SAVES_KEY = 'warga62_local_saves_v1';

// Read configuration from Vite environment variables (supports VITE_SUPABASE_URL, SUPABASE_URL, or /api/config)
let envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
let envKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

let cachedClient: SupabaseClient | null = null;
let configFetchPromise: Promise<void> | null = null;

export async function ensureConfigLoaded(): Promise<void> {
  if (envUrl && envKey) {
    if (!cachedClient) {
      try {
        cachedClient = createClient(envUrl, envKey);
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
      }
    }
    return;
  }

  if (!configFetchPromise) {
    configFetchPromise = fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.supabaseUrl && data?.supabaseAnonKey) {
          envUrl = data.supabaseUrl.trim();
          envKey = data.supabaseAnonKey.trim();
          if (envUrl && envKey) {
            cachedClient = createClient(envUrl, envKey);
          }
        }
      })
      .catch(() => {});
  }
  await configFetchPromise;
}

// Initial attempt to create client
if (envUrl && envKey) {
  try {
    cachedClient = createClient(envUrl, envKey);
  } catch {}
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  if (!envUrl || !envKey) {
    ensureConfigLoaded();
    return null;
  }

  try {
    cachedClient = createClient(envUrl, envKey);
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isCloudConfigured(): boolean {
  return Boolean(envUrl && envKey);
}

// Save progress to Supabase Cloud & Local Storage Backup
export async function saveGameToCloud(
  saveCode: string,
  data: Omit<GameSaveData, 'save_code' | 'saved_at'>
): Promise<{ success: boolean; cloudSaved: boolean; message: string }> {
  await ensureConfigLoaded();
  const cleanCode = saveCode.trim().toUpperCase();
  const timestamp = new Date().toISOString();

  const payload: GameSaveData = {
    save_code: cleanCode,
    game_name: 'Simulator Warga62',
    round_count: data.round_count,
    current_player_index: data.current_player_index,
    players: data.players,
    tiles: data.tiles,
    arisan_pot: data.arisan_pot,
    economic_index: data.economic_index,
    economic_turn_countdown: data.economic_turn_countdown,
    saved_at: timestamp,
  };

  // 1. Always save to local backup first
  saveToLocalStorage(payload);

  // 2. Sync to Supabase Cloud if configured via environment variables
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: true,
      cloudSaved: false,
      message: `Progres berhasil disimpan dengan kode [${cleanCode}]!`,
    };
  }

  try {
    const { error } = await client
      .from('game_saves')
      .upsert(payload, { onConflict: 'save_code' });

    if (error) {
      console.warn('Supabase upsert note:', error.message);
      return {
        success: true,
        cloudSaved: false,
        message: `Progres tersimpan di perangkat lokal dengan kode [${cleanCode}].`,
      };
    }

    return {
      success: true,
      cloudSaved: true,
      message: `🎉 Progres berhasil disimpan ke Cloud dengan kode [${cleanCode}]!`,
    };
  } catch (err) {
    return {
      success: true,
      cloudSaved: false,
      message: `Progres tersimpan di perangkat dengan kode [${cleanCode}].`,
    };
  }
}

// Load progress from Supabase Cloud or Local Backup
export async function loadGameFromCloud(
  saveCode: string
): Promise<{ success: boolean; data?: GameSaveData; message: string }> {
  await ensureConfigLoaded();
  const cleanCode = saveCode.trim().toUpperCase();

  // 1. Try Supabase Cloud first if client exists
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('game_saves')
        .select('*')
        .eq('save_code', cleanCode)
        .maybeSingle();

      if (!error && data) {
        return {
          success: true,
          data: data as GameSaveData,
          message: `Berhasil memuat progres permainan (Kode: ${cleanCode})!`,
        };
      }
    } catch (err) {
      console.warn('Supabase load note, checking local backup:', err);
    }
  }

  // 2. Check local storage
  const localList = listLocalSaves();
  const found = localList.find((s) => s.save_code.toUpperCase() === cleanCode);

  if (found) {
    return {
      success: true,
      data: found,
      message: `Berhasil memuat progres permainan (Kode: ${cleanCode})!`,
    };
  }

  return {
    success: false,
    message: `Kode simpan [${cleanCode}] tidak ditemukan. Pastikan kodenya benar.`,
  };
}

// Local storage management
function saveToLocalStorage(payload: GameSaveData): void {
  try {
    const existing = listLocalSaves();
    const filtered = existing.filter((s) => s.save_code !== payload.save_code);
    const updated = [payload, ...filtered].slice(0, 10);
    localStorage.setItem(LOCAL_STORAGE_SAVES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save to local storage', err);
  }
}

export function listLocalSaves(): GameSaveData[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SAVES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function deleteLocalSave(code: string): void {
  try {
    const existing = listLocalSaves();
    const updated = existing.filter((s) => s.save_code !== code);
    localStorage.setItem(LOCAL_STORAGE_SAVES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete local save', err);
  }
}
