import mongoose, { Model, model, Schema } from 'mongoose';

import type { GiveawayDocument } from 'types/giveaway';

export const giveawayModel: Model<GiveawayDocument> =
  mongoose.models['giveaway'] ||
  model<GiveawayDocument>(
    'giveaway',
    new Schema<GiveawayDocument>({
      guildId: { type: String, required: true },
      channelId: { type: String, required: true },
      messageId: { type: String, required: true },
      prize: { type: String, required: true },
      duration: { type: Number, required: true },
      winnerCount: { type: Number, required: true },
      participants: [{ type: String }],
      winnerIds: [{ type: String }],
      createdAt: { type: Number, required: true },
      endsAt: { type: Number, required: true }
    })
  );
