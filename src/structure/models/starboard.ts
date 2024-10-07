import mongoose, { Model, model, Schema, Types } from 'mongoose';

import type { StarboardDocument, StarboardMessageDocument } from 'types/starboard';

const starboardMessageSchema = new Schema<StarboardMessageDocument>({
  messageId: { type: String, required: true, unique: true },
  starboardMessageId: { type: String, required: false, unique: true },
  reactedUsers: [{ type: String, required: true, default: [] }]
});

export const starboardMessageModel: Model<StarboardMessageDocument> =
  mongoose.models['starboard_message'] || model<StarboardMessageDocument>('starboard_message', starboardMessageSchema);

export const starboardModel: Model<StarboardDocument> =
  mongoose.models['starboard'] ||
  model<StarboardDocument>(
    'starboard',
    new Schema<StarboardDocument>({
      guildId: { type: String, required: true, unique: true },
      enabled: { type: Boolean, default: false, required: true },
      channelId: { type: String, required: false },
      minimumStars: { type: Number, required: false },
      messages: [{ type: Types.ObjectId, ref: 'starboard_message' }]
    })
  );
