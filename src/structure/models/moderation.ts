import mongoose, { Model, model, Schema } from 'mongoose';

import type { ModerationDocument } from 'types/moderation';

export const moderationModel: Model<ModerationDocument> =
  mongoose.models['moderation'] ||
  model<ModerationDocument>(
    'moderation',
    new Schema<ModerationDocument>({
      guildId: { type: String, required: true },
      enabled: { type: Boolean, default: true, required: true },
      staffroleId: { type: String, required: false },
      reasonsRequired: { type: Boolean, default: false, required: true }
    })
  );
