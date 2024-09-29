import mongoose, { Model, model, Schema } from 'mongoose';

import type { TicketDocument } from 'types/ticket';

export const ticketModel: Model<TicketDocument> =
  mongoose.models['ticket'] ||
  model<TicketDocument>(
    'ticket',
    new Schema<TicketDocument>({
      guildId: { type: String, required: true },
      channelId: { type: String, required: true },
      claimedBy: { type: String, required: false },
      createdBy: { type: String, required: true },
      createdAt: { type: Number, default: Date.now() },
      closed: { type: Boolean, default: false },
      locked: { type: Boolean, default: false },
      users: { type: [{ type: String, required: true }], required: true },
      choice: { type: String, required: true },
    }),
  );
