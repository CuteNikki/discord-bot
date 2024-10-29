import mongoose, { Model, model, Schema } from 'mongoose';

import type { CustomVoiceDocument } from 'types/custom-voice';

export const customVoiceModel: Model<CustomVoiceDocument> =
  mongoose.models['custom_voice_config'] ||
  model<CustomVoiceDocument>(
    'custom_voice_config',
    new Schema<CustomVoiceDocument>({
      guildId: { type: String, required: true },
      enabled: { type: Boolean, required: true, default: false },
      channelId: { type: String, required: true },
      parentId: { type: String, required: true },
      defaultLimit: { type: Number, required: false }
    })
  );
