export enum BadgeType {
  Developer,
  StaffMember,
  Translator,
  Supporter,
  ExpertBughunter,
  Bughunter,
  Coinflipper
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
  Cookie,
  Axe,
  Sword,
  Shield,
  Wood
}

export enum ItemCategory {
  Miscellanous,
  Tools, // FishingRod, Pickaxe, Axe, Sword, Shield
  Gatherables, // Rock, Wood, Fish, Boot, Scrap, Diamond
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
  lastRob?: number;
  lastWork?: number;
  wallet: number;
  bank: number;
  description?: string;
  color?: string;
  inventory: Item[];
};

/**
 * This type is used to get the rank of a user in the leaderboard
 *
 * Username, displayname and avatar is only available in the computed leaderboard
 */
export type PositionUser = UserDocument & { position: number; username?: string; displayName?: string; avatar?: string };
