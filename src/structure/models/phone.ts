import mongoose, { Model, model, Schema, Types } from 'mongoose';

interface AvailableChannel {
  _id: Types.ObjectId;
  channelId: string;
  guildId: string;
}

const availableChannelSchema = new Schema<AvailableChannel>({
  channelId: { type: String, required: true, unique: true },
});

export const availableChannelModel: Model<AvailableChannel> =
  mongoose.models['available_channel'] || model<AvailableChannel>('available_channel', availableChannelSchema);

interface Connection {
  _id: Types.ObjectId;
  channelIdOne: string;
  channelIdTwo: string;
}

const connectionSchema = new Schema<Connection>({
  channelIdOne: { type: String, required: true },
  channelIdTwo: { type: String, required: true },
});

export const connectionModel: Model<Connection> = mongoose.models['connection'] || model<Connection>('connection', connectionSchema);
