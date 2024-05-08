import mongoose from 'mongoose';

export enum AnnouncementType {
  USER_CHANNEL = 'USER_CHANNEL',
  OTHER_CHANNEL = 'OTHER_CHANNEL',
  PRIVATE_MESSAGE = 'PRIVATE_MESSAGE',
}

export const guildModel = mongoose.model(
  'guild',
  new mongoose.Schema({
    guildId: { type: String, required: true },
    levels: {
      type: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, required: false },
        announcement: { type: String, default: AnnouncementType.USER_CHANNEL, enum: Object.values(AnnouncementType) },
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
        announcement: AnnouncementType.USER_CHANNEL,
        ignoredRoles: [],
        ignoredChannels: [],
        enabledChannels: [],
        rewards: [],
      },
    },
  })
);
