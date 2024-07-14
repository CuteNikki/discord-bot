import mongoose, { Model, model, Schema, Types } from 'mongoose';

export interface ClientSettings {
  _id: Types.ObjectId;
  applicationId: string;
  database: {
    lastWeeklyClear: number;
  };
  support: {
    guildId: string;
    inviteUrl: string;
  };
  inviteUrl: string;
}

const clientSchema = new Schema<ClientSettings>({
  applicationId: { type: String, required: true },
  database: {
    type: { lastWeeklyClear: { type: Number, requiredPaths: false } },
    default: { lastWeeklyClear: 0 },
  },
  support: {
    type: {
      guildId: { type: String, required: true },
      inviteUrl: { type: String, required: true },
    },
    default: { guildId: 'unavailable', invite: 'unavailable' },
  },
  inviteUrl: { type: String, required: true, default: 'unavailable' },
});

export const clientModel: Model<ClientSettings> = mongoose.models['client'] || model<ClientSettings>('client', clientSchema);
