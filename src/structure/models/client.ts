import mongoose, { Model, model, Schema } from 'mongoose';

import { defaultShop } from 'constants/shop';

import type { ClientDocument } from 'types/client';

export const clientModel: Model<ClientDocument> =
  mongoose.models['client'] ||
  model<ClientDocument>(
    'client',
    new Schema<ClientDocument>({
      applicationId: { type: String, required: true },
      database: {
        type: { lastWeeklyClearAt: { type: Number, required: true, default: 0 } },
        default: { lastWeeklyClearAt: 0 }
      },
      support: {
        type: {
          guildId: { type: String },
          guildInvite: { type: String },
          botInvite: { type: String }
        },
        default: {}
      },
      stats: {
        type: {
          commandsExecuted: { type: Number, required: true, default: 0 },
          commandsFailed: { type: Number, required: true, default: 0 },
          buttonsExecuted: { type: Number, required: true, default: 0 },
          buttonsFailed: { type: Number, required: true, default: 0 },
          guildsJoined: { type: Number, required: true, default: 0 },
          guildsLeft: { type: Number, required: true, default: 0 }
        },
        default: {
          commandsExecuted: 0,
          commandsFailed: 0,
          buttonsExecuted: 0,
          buttonsFailed: 0,
          guildsJoined: 0,
          guildsLeft: 0
        }
      },
      shop: {
        type: [
          {
            id: { type: Number, required: true },
            category: { type: Number, required: true },
            emoji: { type: String, required: true },
            name: { type: String, required: true },
            description: { type: String, required: true },
            buyPrice: { type: Number, required: true },
            sellPrice: { type: Number, required: true }
          }
        ],
        default: defaultShop
      }
    })
  );
