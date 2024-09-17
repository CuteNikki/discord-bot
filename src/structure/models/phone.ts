import mongoose, { Model, model, Schema, Types } from 'mongoose';

export interface AvailableChannel {
  _id: Types.ObjectId;
  channelId: string;
  userId: string;
}

const availableChannelSchema = new Schema<AvailableChannel>({
  channelId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
});

export const availableChannelModel: Model<AvailableChannel> =
  mongoose.models['available_channel'] || model<AvailableChannel>('available_channel', availableChannelSchema);

export interface Connection {
  _id: Types.ObjectId;
  channelIdOne: string;
  userIdOne: string; // We store user ids for translation purposes
  channelIdTwo: string;
  userIdTwo: string;
  lastMessageAt?: number;
}

const connectionSchema = new Schema<Connection>({
  channelIdOne: { type: String, required: true },
  userIdOne: { type: String, required: true },
  channelIdTwo: { type: String, required: true },
  userIdTwo: { type: String, required: true },
  lastMessageAt: { type: Number },
});

export const connectionModel: Model<Connection> = mongoose.models['connection'] || model<Connection>('connection', connectionSchema);
