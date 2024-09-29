import type { Types } from 'mongoose';

export type TicketDocument = {
  _id: Types.ObjectId;
  guildId: string;
  channelId: string;
  claimedBy: string;
  createdBy: string;
  createdAt: number;
  closed: boolean;
  locked: boolean;
  users: string[];
  choice: string;
};
