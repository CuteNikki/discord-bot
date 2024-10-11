import mongoose, { Model, model, Schema, Types } from 'mongoose';

import type { TicketConfigDocument, TicketDocument, TicketGroupDocument } from 'types/ticket';

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
      choice: { type: String, required: true }
    })
  );

export const ticketGroupModel: Model<TicketGroupDocument> =
  mongoose.models['ticket_group'] ||
  model<TicketGroupDocument>(
    'ticket_group',
    new Schema<TicketGroupDocument>({
      maxTickets: { type: Number, required: true },
      transcriptChannelId: { type: String, required: true },
      parentChannelId: { type: String, required: true },
      staffRoleId: { type: String, required: true },
      choices: [{ label: { type: String, required: true }, style: { type: Number, required: true }, emoji: { type: String, required: false } }],
      channelId: { type: String, required: true }
    })
  );

export const ticketConfigModel: Model<TicketConfigDocument> =
  mongoose.models['ticket_config'] ||
  model<TicketConfigDocument>(
    'ticket_config',
    new Schema<TicketConfigDocument>({
      guildId: { type: String, required: true, unique: true },
      enabled: { type: Boolean, default: false, required: true },
      groups: [{ type: Types.ObjectId, ref: 'ticket_group' }]
    })
  );
