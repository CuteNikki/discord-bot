import mongoose from 'mongoose';

export enum AnnouncementType {
  USER_CHANNEL = 'USER_CHANNEL',
  OTHER_CHANNEL = 'OTHER_CHANNEL',
  PRIVATE_MESSAGE = 'PRIVATE_MESSAGE',
}

export const availableEvents = [
  'applicationCommandPermissionsUpdate',
  'autoModerationActionExecution',
  'autoModerationRuleCreate',
  'autoModerationRuleDelete',
  'autoModerationRuleUpdate',
  'channelCreate',
  'channelDelete',
  'channelUpdate',
  'channelPinsUpdate',
  'emojiCreate',
  'emojiDelete',
  'emojiUpdate',
  'guildAuditLogEntryCreate',
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
  'threadMembersUpdate',
  'voiceStateUpdate',
  'webhooksUpdate',
];

export interface Guild {
  guildId: string;
  moderation: {
    enabled: boolean;
  };
  log: {
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
      channelPinsUpdate: boolean;
      emojiCreate: boolean;
      emojiDelete: boolean;
      emojiUpdate: boolean;
      guildAuditLogEntryCreate: boolean;
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
      threadMembersUpdate: boolean;
      voiceStateUpdate: boolean;
      webhooksUpdate: boolean;
    };
  };
  music: {
    enabled: boolean;
  };
  level: {
    enabled: boolean;
    channelId?: string;
    announcement: AnnouncementType;
    ignoredRoles: string[];
    ignoredChannels: string[];
    enabledChannels: string[];
    rewards: { roleId: string; level: number; _id: mongoose.Types.ObjectId }[];
  };
}

export const guildModel = mongoose.model(
  'guild',
  new mongoose.Schema<Guild>({
    guildId: { type: String, required: true },
    music: {
      type: {
        enabled: { type: Boolean },
      },
      default: {
        enabled: false,
      },
    },
    moderation: {
      type: {
        enabled: { type: Boolean },
      },
      default: {
        enabled: true,
      },
    },
    log: {
      type: {
        channelId: { type: String },
        events: {
          applicationCommandPermissionsUpdate: { type: Boolean },
          autoModerationActionExecution: { type: Boolean },
          autoModerationRuleCreate: { type: Boolean },
          autoModerationRuleDelete: { type: Boolean },
          autoModerationRuleUpdate: { type: Boolean },
          channelCreate: { type: Boolean },
          channelDelete: { type: Boolean },
          channelUpdate: { type: Boolean },
          channelPinsUpdate: { type: Boolean },
          emojiCreate: { type: Boolean },
          emojiDelete: { type: Boolean },
          emojiUpdate: { type: Boolean },
          guildAuditLogEntryCreate: { type: Boolean },
          guildBanAdd: { type: Boolean },
          guildBanRemove: { type: Boolean },
          guildMemberAdd: { type: Boolean },
          guildMemberRemove: { type: Boolean },
          guildMemberUpdate: { type: Boolean },
          guildScheduledEventCreate: { type: Boolean },
          guildScheduledEventDelete: { type: Boolean },
          guildScheduledEventUpdate: { type: Boolean },
          guildScheduledEventUserAdd: { type: Boolean },
          guildScheduledEventUserRemove: { type: Boolean },
          guildUpdate: { type: Boolean },
          inviteCreate: { type: Boolean },
          inviteDelete: { type: Boolean },
          messageUpdate: { type: Boolean },
          messageDelete: { type: Boolean },
          messageBulkDelete: { type: Boolean },
          messageReactionRemoveAll: { type: Boolean },
          roleCreate: { type: Boolean },
          roleDelete: { type: Boolean },
          roleUpdate: { type: Boolean },
          stickerCreate: { type: Boolean },
          stickerDelete: { type: Boolean },
          stickerUpdate: { type: Boolean },
          threadCreate: { type: Boolean },
          threadDelete: { type: Boolean },
          threadUpdate: { type: Boolean },
          threadMembersUpdate: { type: Boolean },
          voiceStateUpdate: { type: Boolean },
          webhooksUpdate: { type: Boolean },
        },
      },
      default: {
        channelId: undefined,
        events: {
          applicationCommandPermissionsUpdate: false,
          autoModerationActionExecution: false,
          autoModerationRuleCreate: false,
          autoModerationRuleDelete: false,
          autoModerationRuleUpdate: false,
          channelCreate: false,
          channelDelete: false,
          channelUpdate: false,
          channelPinsUpdate: false,
          emojiCreate: false,
          emojiDelete: false,
          emojiUpdate: false,
          guildAuditLogEntryCreate: false,
          guildBanAdd: false,
          guildBanRemove: false,
          guildMemberAdd: false,
          guildMemberRemove: false,
          guildMemberUpdate: false,
          guildScheduledEventCreate: false,
          guildScheduledEventDelete: false,
          guildScheduledEventUpdate: false,
          guildScheduledEventUserAdd: false,
          guildScheduledEventUserRemove: false,
          guildUpdate: false,
          inviteCreate: false,
          inviteDelete: false,
          messageUpdate: false,
          messageDelete: false,
          messageBulkDelete: false,
          messageReactionRemoveAll: false,
          roleCreate: false,
          roleDelete: false,
          roleUpdate: false,
          stickerCreate: false,
          stickerDelete: false,
          stickerUpdate: false,
          threadCreate: false,
          threadDelete: false,
          threadUpdate: false,
          threadMembersUpdate: false,
          voiceStateUpdate: false,
          webhooksUpdate: false,
        },
      },
    },
    level: {
      type: {
        enabled: { type: Boolean },
        channelId: { type: String },
        announcement: { type: String, enum: Object.values(AnnouncementType) },
        ignoredRoles: [{ type: String }],
        ignoredChannels: [{ type: String }],
        enabledChannels: [{ type: String }],
        rewards: [
          {
            level: { type: Number, required: true },
            roleId: { type: String, required: true },
          },
        ],
      },
      default: {
        enabled: false,
        channelId: undefined,
        announcement: AnnouncementType.USER_CHANNEL,
        ignoredRoles: [],
        ignoredChannels: [],
        enabledChannels: [],
        rewards: [],
      },
    },
  })
);
