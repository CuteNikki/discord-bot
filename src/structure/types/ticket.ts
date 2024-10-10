import type { ButtonStyle } from 'discord.js';
import type { Types } from 'mongoose';

export type TicketChoice = {
  label: string;
  style: ButtonStyle;
  emoji?: string;
};

export type TicketGroupDocument = {
  _id: Types.ObjectId;
  maxTickets: number;
  transcriptChannelId: string;
  parentChannelId: string;
  staffRoleId: string;
  choices: TicketChoice[];
  channelId: string;
};

export type TicketConfigDocument = {
  guildId: string;
  enabled: boolean;
  groups: TicketGroupDocument[];
};

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
