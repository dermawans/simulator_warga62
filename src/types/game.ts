export type PropertyType = 'property' | 'corner' | 'tax' | 'arisan' | 'event' | 'bumn';

export interface BoardTile {
  id: number;
  name: string;
  type: PropertyType;
  city?: string;
  price: number;
  baseRent: number;
  housePrice: number;
  houses: number; // 0: Lapak PKL, 1: Ruko, 2: Mall, 3: Superblok
  ownerId?: string | null;
  icon: string;
  description: string;
  colorTag?: string;
}

export interface CharacterPreset {
  id: string;
  name: string;
  role: string;
  title: string;
  perkDescription: string;
  quote: string;
  avatarEmoji: string;
  color: string;
  accessory: string;
}

export interface Player {
  id: string;
  name: string;
  characterId: string;
  isBot: boolean;
  avatarEmoji: string;
  accessory: string;
  color: string;
  quote: string;
  position: number;
  money: number;
  karma: number; // 0 to 100 (%)
  inJail: boolean;
  jailTurns: number;
  totalBribes: number;
  totalTaxesPaid: number;
  sabotagesRemaining: number;
  isBankrupt: boolean;
  jointVentures?: { [propertyId: number]: string }; // propertyId -> partner player id
}

export type EconomicPhase = 'NORMAL' | 'INFLASI_TINGGI' | 'BANSOS_CAIR' | 'TAHUN_POLITIK' | 'KRISIS_MONETER';

export interface EconomicCondition {
  phase: EconomicPhase;
  title: string;
  description: string;
  rentMultiplier: number;
  taxMultiplier: number;
  corruptionRiskMultiplier: number;
  badgeColor: string;
}

export interface EventCard {
  id: string;
  title: string;
  category: 'NASIB' | 'KESEMPATAN' | 'RAZIA' | 'ARISAN';
  description: string;
  effectDescription: string;
  moneyChange: number;
  karmaChange: number;
  goToJail?: boolean;
  moveToTile?: number;
  isJackpot?: boolean;
}

export interface SabotageSkill {
  id: string;
  name: string;
  cost: number;
  description: string;
  effectType: 'FREEZE_PROPERTY' | 'RAID_OWNER' | 'TAX_AUDIT' | 'SANTET_LUCK';
  icon: string;
}

export interface LeaderboardRecord {
  id: string;
  name: string;
  role: string;
  characterEmoji: string;
  netWorth: number;
  totalBribes: number;
  category: 'SULTAN' | 'KORUPTOR' | 'BERKAH';
  statusNote: string;
  date: string;
}
