import type { Types } from 'mongoose';

export type WeeklyLevelDocument = {
  _id: Types.ObjectId;
  userId: string;
  guildId: string;
  level: number;
  xp: number;
};

export type LevelDocument = {
  _id: Types.ObjectId;
  userId: string;
  guildId: string;
  level: number;
  xp: number;
};

/**
 * This type is used to get the rank of a user in the leaderboard
 *
 * Username is only available in the computed leaderboard
 */
export type PositionLevel = LevelDocument & { position: number; username?: string };
