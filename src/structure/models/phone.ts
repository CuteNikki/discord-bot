import mongoose, { Model, model, Schema } from 'mongoose';

import type { AvailableChannelDocument, ConnectionDocument } from 'types/phone';

export const availableChannelModel: Model<AvailableChannelDocument> =
  mongoose.models['available_channel'] ||
  model<AvailableChannelDocument>(
    'available_channel',
    new Schema<AvailableChannelDocument>({
      channelId: { type: String, required: true, unique: true },
      userId: { type: String, required: true }
    })
  );

export const connectionModel: Model<ConnectionDocument> =
  mongoose.models['connection'] ||
  model<ConnectionDocument>(
    'connection',
    new Schema<ConnectionDocument>({
      channelIdOne: { type: String, required: true },
      userIdOne: { type: String, required: true },
      channelIdTwo: { type: String, required: true },
      userIdTwo: { type: String, required: true },
      lastMessageAt: { type: Number }
    })
  );
