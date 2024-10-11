import type { Types } from 'mongoose';

import type { AnnouncementType, LevelReward } from 'types/guild';

export type LevelConfigDocument = {
  _id: Types.ObjectId;
  guildId: string;
  enabled: boolean;
  channelId?: string;
  announcement: AnnouncementType;
  ignoredRoles: string[];
  ignoredChannels: string[];
  enabledChannels: string[];
  rewards: LevelReward[];
};

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
 * Username, displayname and avatar is only available in the computed leaderboard
 */
export type PositionLevel = LevelDocument & { position: number; username?: string; displayName?: string; avatar?: string };
