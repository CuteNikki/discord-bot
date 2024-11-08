import { ItemCategory, ItemType, type Item } from 'types/user';

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
export const axe: Item = {
  id: ItemType.Axe,
  category: ItemCategory.Tools,
  description: 'Can be used to chop trees.',
  emoji: '🪓',
  name: 'Axe'
};
export const sword: Item = {
  id: ItemType.Sword,
  category: ItemCategory.Tools,
  description: 'Can be used to fight enemies.',
  emoji: '⚔️',
  name: 'Sword'
};
export const shield: Item = {
  id: ItemType.Shield,
  category: ItemCategory.Tools,
  description: 'Can be used to protect yourself.',
  emoji: '🛡️',
  name: 'Shield'
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
export const wood: Item = {
  id: ItemType.Wood,
  category: ItemCategory.Gatherables,
  description: 'Can be sold for a small amount of money.',
  emoji: '🪵',
  name: 'Wood'
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
