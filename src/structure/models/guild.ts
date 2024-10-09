import mongoose, { Model, model, Schema } from 'mongoose';

import { AnnouncementType, type GuildDocument } from 'types/guild';

export const guildModel: Model<GuildDocument> =
  mongoose.models['guild'] ||
  model<GuildDocument>(
    'guild',
    new Schema<GuildDocument>({
      guildId: { type: String, required: true },
      language: { type: String, required: false },
      moderation: {
        type: {
          enabled: { type: Boolean }
        },
        default: {
          enabled: true
        }
      },
      counting: {
        type: {
          channelId: { type: String },
          resetOnFail: { type: Boolean, default: false, required: true },
          highestNumber: { type: Number, default: 0, required: true },
          highestNumberAt: { type: Number },
          currentNumber: { type: Number, default: 0, required: true },
          currentNumberBy: { type: String },
          currentNumberAt: { type: Number }
        },
        default: {
          resetOnFail: false
        }
      },
      ticket: {
        type: {
          enabled: { type: Boolean },
          systems: [
            {
              channelId: { type: String, required: true },
              maxTickets: { type: Number, required: true },
              transcriptChannelId: { type: String, required: true },
              parentChannelId: { type: String, required: true },
              staffRoleId: { type: String, required: true },
              choices: [
                {
                  label: { type: String, required: true },
                  style: { type: String, required: true },
                  emoji: { type: String, required: false }
                }
              ]
            }
          ]
        },
        default: {
          enabled: true,
          systems: []
        }
      },
      level: {
        type: {
          enabled: { type: Boolean },
          channelId: { type: String },
          announcement: {
            type: Number,
            enum: Object.values(AnnouncementType).filter((value) => typeof value === 'number')
          },
          ignoredRoles: [{ type: String }],
          ignoredChannels: [{ type: String }],
          enabledChannels: [{ type: String }],
          rewards: [
            {
              level: { type: Number, required: true },
              roleId: { type: String, required: true }
            }
          ]
        },
        default: {
          enabled: false,
          channelId: undefined,
          announcement: AnnouncementType.UserChannel,
          ignoredRoles: [],
          ignoredChannels: [],
          enabledChannels: [],
          rewards: []
        }
      },
      welcome: {
        type: {
          channelId: { type: String },
          enabled: { type: Boolean },
          roles: [{ type: String }],
          message: {
            content: { type: String },
            embed: {
              color: { type: String },
              title: { type: String },
              url: { type: String },
              description: { type: String },
              thumbnail: { type: String },
              image: { type: String },
              author: {
                name: { type: String },
                icon_url: { type: String },
                url: { type: String }
              },
              footer: {
                text: { type: String },
                icon_url: { type: String }
              },
              fields: [
                {
                  name: { type: String },
                  value: { type: String },
                  inline: { type: Boolean }
                }
              ]
            }
          }
        },
        default: {
          enabled: true,
          message: {
            content: null,
            embed: {
              color: undefined,
              description: undefined,
              image: undefined,
              thumbnail: undefined,
              title: undefined,
              url: undefined,
              author: {
                name: undefined,
                icon_url: undefined,
                url: undefined
              },
              fields: [],
              footer: {
                text: undefined,
                icon_url: undefined
              }
            }
          },
          roles: []
        }
      },
      farewell: {
        type: {
          channelId: { type: String },
          enabled: { type: Boolean },
          message: {
            content: { type: String },
            embed: {
              color: { type: String },
              title: { type: String },
              url: { type: String },
              description: { type: String },
              thumbnail: { type: String },
              image: { type: String },
              author: {
                name: { type: String },
                icon_url: { type: String },
                url: { type: String }
              },
              footer: {
                text: { type: String },
                icon_url: { type: String }
              },
              fields: [
                {
                  name: { type: String },
                  value: { type: String },
                  inline: { type: Boolean }
                }
              ]
            }
          }
        },
        default: {
          enabled: true,
          message: {
            content: null,
            embed: {
              color: undefined,
              description: undefined,
              image: undefined,
              thumbnail: undefined,
              title: undefined,
              url: undefined,
              author: {
                name: undefined,
                icon_url: undefined,
                url: undefined
              },
              fields: [],
              footer: {
                text: undefined,
                icon_url: undefined
              }
            }
          }
        }
      },
      log: {
        type: {
          enabled: { type: Boolean },
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
            emojiCreate: { type: Boolean },
            emojiDelete: { type: Boolean },
            emojiUpdate: { type: Boolean },
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
            voiceStateUpdate: { type: Boolean }
          }
        },
        default: {
          enabled: true,
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
            emojiCreate: false,
            emojiDelete: false,
            emojiUpdate: false,
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
            voiceStateUpdate: false
          }
        }
      }
    })
  );
