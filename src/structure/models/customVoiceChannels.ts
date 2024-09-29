import mongoose, { Model, model, Schema } from 'mongoose';

import type { CustomVoiceDocument } from 'types/custom-voice';

export const customVoiceModel: Model<CustomVoiceDocument> =
  mongoose.models['custom_voice_channel'] ||
  model<CustomVoiceDocument>(
    'custom_voice_channel',
    new Schema<CustomVoiceDocument>({
      channelId: { type: String, required: true },
      guildId: { type: String, required: true },
      ownerId: { type: String, required: true },
    }),
  );
