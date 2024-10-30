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
  marriedTo?: string;
  marriedAt?: number;
  lastDaily?: number;
  wallet: number;
  bank: number;
  description?: string;
  inventory: Item[];
};
