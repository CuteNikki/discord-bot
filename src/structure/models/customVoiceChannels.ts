import mongoose, { Model, model, Schema, Types } from 'mongoose';
import type { CustomVoiceDocument } from 'types/custom-voice';

const customVoiceSchema = new Schema<CustomVoiceDocument>({
  channelId: { type: String, required: true },
  guildId: { type: String, required: true },
  ownerId: { type: String, required: true },
});

export const customVoiceModel: Model<CustomVoiceDocument> =
  mongoose.models['custom_voice_channel'] || model<CustomVoiceDocument>('custom_voice_channel', customVoiceSchema);
