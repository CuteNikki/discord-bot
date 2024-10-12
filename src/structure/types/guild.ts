import type { Types } from 'mongoose';
import type { CountingDocument } from 'types/counting';
import type { CustomVoiceDocument } from 'types/custom-voice';
import type { FarewellDocument } from 'types/farewell';
import type { LevelConfigDocument } from 'types/level';
import type { ModerationDocument } from 'types/moderation';
import type { ReactionRoleDocument } from 'types/reaction-roles';
import type { StarboardDocument } from 'types/starboard';
import type { TicketConfigDocument } from 'types/ticket';
import type { WelcomeDocument } from 'types/welcome';

export const availableEvents = [
  'applicationCommandPermissionsUpdate',
  'autoModerationActionExecution',
  'autoModerationRuleCreate',
  'autoModerationRuleDelete',
  'autoModerationRuleUpdate',
  'channelCreate',
  'channelDelete',
  'channelUpdate',
  'emojiCreate',
  'emojiDelete',
  'emojiUpdate',
  'guildBanAdd',
  'guildBanRemove',
  'guildMemberAdd',
  'guildMemberRemove',
  'guildMemberUpdate',
  'guildScheduledEventCreate',
  'guildScheduledEventDelete',
  'guildScheduledEventUpdate',
  'guildScheduledEventUserAdd',
  'guildScheduledEventUserRemove',
  'guildUpdate',
  'inviteCreate',
  'inviteDelete',
  'messageUpdate',
  'messageDelete',
  'messageBulkDelete',
  'messageReactionRemoveAll',
  'roleCreate',
  'roleDelete',
  'roleUpdate',
  'stickerCreate',
  'stickerDelete',
  'stickerUpdate',
  'threadCreate',
  'threadDelete',
  'threadUpdate',
  'voiceStateUpdate'
];

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
  log: {
    enabled: boolean;
    channelId?: string;
    events: {
      applicationCommandPermissionsUpdate: boolean;
      autoModerationActionExecution: boolean;
      autoModerationRuleCreate: boolean;
      autoModerationRuleDelete: boolean;
      autoModerationRuleUpdate: boolean;
      channelCreate: boolean;
      channelDelete: boolean;
      channelUpdate: boolean;
      emojiCreate: boolean;
      emojiDelete: boolean;
      emojiUpdate: boolean;
      guildBanAdd: boolean;
      guildBanRemove: boolean;
      guildMemberAdd: boolean;
      guildMemberRemove: boolean;
      guildMemberUpdate: boolean;
      guildScheduledEventCreate: boolean;
      guildScheduledEventDelete: boolean;
      guildScheduledEventUpdate: boolean;
      guildScheduledEventUserAdd: boolean;
      guildScheduledEventUserRemove: boolean;
      guildUpdate: boolean;
      inviteCreate: boolean;
      inviteDelete: boolean;
      messageUpdate: boolean;
      messageDelete: boolean;
      messageBulkDelete: boolean;
      messageReactionRemoveAll: boolean;
      roleCreate: boolean;
      roleDelete: boolean;
      roleUpdate: boolean;
      stickerCreate: boolean;
      stickerDelete: boolean;
      stickerUpdate: boolean;
      threadCreate: boolean;
      threadDelete: boolean;
      threadUpdate: boolean;
      voiceStateUpdate: boolean;
    };
  };
};
