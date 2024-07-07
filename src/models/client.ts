import mongoose from 'mongoose';

export interface ClientSettings {
  applicationId: string;
  inviteUrl: string;
  database: {
    lastWeeklyClear: number;
  };
  support: {
    guildId: string;
    inviteUrl: string;
  };
}

export const clientModel = mongoose.model(
  'client',
  new mongoose.Schema<ClientSettings>({
    applicationId: { type: String, required: true },
    database: {
      type: { lastWeeklyClear: { type: Number, requiredPaths: false } },
      default: { lastWeeklyClear: 0 },
    },
    inviteUrl: { type: String, required: true, default: 'unavailable' },
    support: {
      type: {
        guildId: { type: String, required: true },
        inviteUrl: { type: String, required: true },
      },
      default: { guildId: 'unavailable', invite: 'unavailable' },
    },
  })
);
