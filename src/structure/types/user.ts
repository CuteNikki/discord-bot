export enum BadgeType {
  Developer,
  StaffMember,
  Translator,
  Supporter,
  ExpertBughunter,
  Bughunter
}

export type Badge = {
  id: BadgeType;
  receivedAt: number;
};

export enum ItemType {
  Custom,
  Pickaxe,
  FishingRod,
  MarriageRing,
  Diamond,
  Rock,
  Fish,
  Boot,
  Scrap,
  Flower,
  Chocolate,
  Cookie
}

export enum ItemCategory {
  Miscellanous,
  Tools, // FishingRod, Pickaxe
  Gatherables, // Rock, Fish, Boot, Scrap, Diamond
  Gifts // Flower, Chocolate, Cookie, MarriageRing
}

export type Item = {
  id: ItemType;
  category: ItemCategory;
  emoji: string;
  name: string;
  description: string;
};

export type UserDocument = {
  _id: string;
  userId: string;
  banned: boolean;
  language?: string;
  badges: Badge[];
  economyOnboarding: boolean;
  marriedTo?: string;
  marriedAt?: number;
  lastDaily?: number;
  wallet: number;
  bank: number;
  description?: string;
  inventory: Item[];
};

/**
 * This type is used to get the rank of a user in the leaderboard
 *
 * Username, displayname and avatar is only available in the computed leaderboard
 */
export type PositionUser = UserDocument & { position: number; username?: string; displayName?: string; avatar?: string };

export const pickaxe: Item = {
  id: ItemType.Pickaxe,
  category: ItemCategory.Tools,
  description: 'Can be used to go mining.',
  emoji: '⛏️',
  name: 'Pickaxe'
};
export const fishingRod: Item = {
  id: ItemType.FishingRod,
  category: ItemCategory.Tools,
  description: 'Can be used to go fishing.',
  emoji: '🎣',
  name: 'Fishing Rod'
};
export const marriageRing: Item = {
  id: ItemType.MarriageRing,
  category: ItemCategory.Gifts,
  description: 'Can be used to propose to someone.',
  emoji: '💍',
  name: 'Marriage Ring'
};
export const diamond: Item = {
  id: ItemType.Diamond,
  category: ItemCategory.Gatherables,
  description: 'Very shiny. Could be worth a lot.',
  emoji: '💎',
  name: 'Diamond'
};
export const rock: Item = {
  id: ItemType.Rock,
  category: ItemCategory.Gatherables,
  description: 'Can be sold for a small amount of money.',
  emoji: '🪨',
  name: 'Rock'
};
export const fish: Item = {
  id: ItemType.Fish,
  category: ItemCategory.Gatherables,
  description: 'Can be sold for a small amount of money.',
  emoji: '🐟',
  name: 'Fish'
};
export const boot: Item = {
  id: ItemType.Boot,
  category: ItemCategory.Gatherables,
  description: 'Can be sold for a small amount of money.',
  emoji: '🥾',
  name: 'Boot'
};
export const scrap: Item = {
  id: ItemType.Scrap,
  category: ItemCategory.Gatherables,
  description: 'Can be sold for a small amount of money.',
  emoji: '🔩',
  name: 'Scrap'
};
export const flower: Item = {
  id: ItemType.Flower,
  category: ItemCategory.Gifts,
  description: 'Can be given to someone.',
  emoji: '🌹',
  name: 'Flower'
};
export const chocolate: Item = {
  id: ItemType.Chocolate,
  category: ItemCategory.Gifts,
  description: 'Can be given to someone.',
  emoji: '🍫',
  name: 'Chocolate'
};
export const cookie: Item = {
  id: ItemType.Cookie,
  category: ItemCategory.Gifts,
  description: 'Can be given to someone.',
  emoji: '🍪',
  name: 'Cookie'
};
