import mongoose, { Model, model, Schema } from 'mongoose';

import type { AvailableChannel, Connection } from 'types/phone';

export const availableChannelModel: Model<AvailableChannel> =
  mongoose.models['available_channel'] ||
  model<AvailableChannel>(
    'available_channel',
    new Schema<AvailableChannel>({
      channelId: { type: String, required: true, unique: true },
      userId: { type: String, required: true },
    }),
  );

export const connectionModel: Model<Connection> =
  mongoose.models['connection'] ||
  model<Connection>(
    'connection',
    new Schema<Connection>({
      channelIdOne: { type: String, required: true },
      userIdOne: { type: String, required: true },
      channelIdTwo: { type: String, required: true },
      userIdTwo: { type: String, required: true },
      lastMessageAt: { type: Number },
    }),
  );
