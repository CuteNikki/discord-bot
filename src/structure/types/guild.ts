import type { Types } from 'mongoose';

import type { CountingDocument } from 'types/counting';
import type { CustomVoiceDocument } from 'types/custom-voice';
import type { FarewellDocument } from 'types/farewell';
import type { GuildLogDocument } from 'types/guild-log';
import type { LevelConfigDocument } from 'types/level';
import type { ModerationDocument } from 'types/moderation';
import type { ReactionRoleDocument } from 'types/reaction-roles';
import type { StarboardDocument } from 'types/starboard';
import type { TicketConfigDocument } from 'types/ticket';
import type { WelcomeDocument } from 'types/welcome';

// !! Embed cannot be empty !!
// Either a title, description, author-name, footer-text or field is needed
export type Embed = {
  color?: string | number | string;
  title?: string; // max 256 characters
  url?: string; // max 256 characters
  description?: string; // max 4096 characters
  thumbnail?: string; // max 256 characters
  image?: string; // max 256 characters
  author?: {
    name?: string; // max 256 characters
    icon_url?: string; // max 256 characters
    url?: string; // max 256 characters
  };
  footer?: {
    text?: string; // max 2048 characters
    icon_url?: string; // max 256 characters
  };
  // max 25 fields
  fields?: {
    name: string; // max 256 characters
    value: string; // max 1024 characters
    inline?: boolean;
  }[];
};

export type Message = {
  content: string | null; // max 2000 characters
  embed: Embed; // max 10 embeds but not using array
};

export type GuildDocument = {
  _id: Types.ObjectId;
  guildId: string;
  language?: string;
  customVoice?: CustomVoiceDocument;
  starboard?: StarboardDocument;
  reactionRoles?: ReactionRoleDocument;
  counting?: CountingDocument;
  ticket?: TicketConfigDocument;
  moderation?: ModerationDocument;
  level?: LevelConfigDocument;
  welcome?: WelcomeDocument;
  farewell?: FarewellDocument;
  log?: GuildLogDocument;
};
