import mongoose, { Model, model, Schema, Types } from 'mongoose';

export interface Ticket {
  _id: Types.ObjectId;
  guildId: string;
  channelId: string;
  claimedBy: string;
  createdBy: string;
  createdAt: number;
  closed: boolean;
  locked: boolean;
  users: string[];
  choice: string;
}

const ticketSchema = new Schema<Ticket>({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  claimedBy: { type: String, required: false },
  createdBy: { type: String, required: true },
  createdAt: { type: Number, default: Date.now() },
  closed: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
  users: { type: [{ type: String, required: true }], required: true },
  choice: { type: String, required: true },
});

export const ticketModel: Model<Ticket> = mongoose.models['ticket'] || model<Ticket>('ticket', ticketSchema);
