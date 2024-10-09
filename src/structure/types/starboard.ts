import type { Types } from 'mongoose';

export type StarboardDocument = {
  _id: Types.ObjectId;
  guildId: string;
  enabled: boolean;
  channelId?: string;
  minimumStars?: number;
  messages: StarboardMessageDocument[];
};

export type StarboardMessageDocument = {
  _id: Types.ObjectId;
  guildId: string;
  messageId: string;
  starboardMessageId?: string;
  reactedUsers: string[];
};
