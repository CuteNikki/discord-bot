import mongoose, { Document } from 'mongoose';

interface AvailableChannel extends Document {
  channelId: string;
  guildId: string;
}

export const availableChannelModel = mongoose.model<AvailableChannel>(
  'available_channel',
  new mongoose.Schema<AvailableChannel>({
    channelId: { type: String, required: true, unique: true },
  })
);

interface Connection extends Document {
  channelIdOne: string;
  channelIdTwo: string;
}

export const connectionModel = mongoose.model<Connection>(
  'connection',
  new mongoose.Schema<Connection>({
    channelIdOne: { type: String, required: true },
    channelIdTwo: { type: String, required: true },
  })
);
