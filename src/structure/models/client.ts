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
  stats: {
    restarts: number;
    commandsExecuted: number;
    commandsFailed: number;
    buttonsExecuted: number;
    buttonsFailed: number;
    guildsJoined: number;
    guildsLeft: number;
  };
}

const clientSchema = new Schema<ClientSettings>({
  applicationId: { type: String, required: true },
  database: {
    type: { lastWeeklyClear: { type: Number, required: true, default: 0 } },
    default: { lastWeeklyClear: 0 },
  },
  support: {
    type: {
      guildId: { type: String, required: true, default: 'unavailable' },
      inviteUrl: { type: String, required: true, default: 'unavailable' },
    },
    default: { guildId: 'unavailable', inviteUrl: 'unavailable' },
  },
  inviteUrl: { type: String, required: true, default: 'unavailable' },
  stats: {
    type: {
      commandsExecuted: { type: Number, required: true, default: 0 },
      commandsFailed: { type: Number, required: true, default: 0 },
      buttonsExecuted: { type: Number, required: true, default: 0 },
      buttonsFailed: { type: Number, required: true, default: 0 },
      guildsJoined: { type: Number, required: true, default: 0 },
      guildsLeft: { type: Number, required: true, default: 0 },
    },
    default: {
      commandsExecuted: 0,
      commandsFailed: 0,
      buttonsExecuted: 0,
      buttonsFailed: 0,
      guildsJoined: 0,
      guildsLeft: 0,
    },
  },
});

export const clientModel: Model<ClientSettings> = mongoose.models['client'] || model<ClientSettings>('client', clientSchema);
