import type { Types } from 'mongoose';

export type GiveawayDocument = {
  _id: Types.ObjectId;
  guildId: string;
  channelId: string;
  messageId: string;
  prize: string;
  duration: number;
  winnerCount: number;
  createdAt: number;
  endsAt: number;
  participants: string[];
  winnerIds: string[];
};
