import mongoose, { Model, model, Schema, Types } from 'mongoose';

export interface CustomVoiceChannel {
  _id: Types.ObjectId;
  channelId: string;
  guildId: string;
  ownerId: string;
}

const customVoiceChannelSchema = new Schema<CustomVoiceChannel>({
  channelId: { type: String, required: true },
  guildId: { type: String, required: true },
  ownerId: { type: String, required: true },
});

export const customVoiceChannelModel: Model<CustomVoiceChannel> =
  mongoose.models['custom_voice_channel'] || model<CustomVoiceChannel>('custom_voice_channel', customVoiceChannelSchema);
