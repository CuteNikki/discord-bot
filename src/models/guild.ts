import mongoose from 'mongoose';

export const guildModel = mongoose.model(
  'guild',
  new mongoose.Schema({
    guildId: { type: String, required: true },
    levels: {
      type: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, required: false },
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
        ignoredChannels: [],
        enabledChannels: [],
        rewards: [],
      },
    },
  })
);
