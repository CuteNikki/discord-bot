
import type { Types } from 'mongoose';

export enum InfractionType {
  Ban,
  Unban,
  TempBan,
  Kick,
  Timeout,
  Warn,
}

export type InfractionDocument = {
  _id: Types.ObjectId;
  userId: string;
  guildId: string;
  staffId: string;
  action: number;
  createdAt: number;
  reason?: string;
  endsAt?: number;
  closed: boolean;
};
