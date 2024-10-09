import mongoose, { Model, model, Schema } from 'mongoose';

import type { CustomVoiceChannelDocument } from 'types/custom-voice-channel';

export const customVoiceChannelModel: Model<CustomVoiceChannelDocument> =
  mongoose.models['custom_voice_channel'] ||
  model<CustomVoiceChannelDocument>(
    'custom_voice_channel',
    new Schema<CustomVoiceChannelDocument>({
      channelId: { type: String, required: true },
      guildId: { type: String, required: true },
      ownerId: { type: String, required: true }
    })
  );
