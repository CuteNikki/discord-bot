import mongoose, { Model, model, Schema } from 'mongoose';

import type { FarewellDocument } from 'types/farewell';

export const farewellModel: Model<FarewellDocument> =
  mongoose.models['farewell'] ||
  model<FarewellDocument>(
    'farewell',
    new Schema<FarewellDocument>({
      guildId: { type: String, required: true, unique: true },
      enabled: { type: Boolean, default: false, required: true },
      channelId: { type: String, required: false },
      message: {
        content: { type: String },
        embed: {
          color: { type: String },
          title: { type: String },
          url: { type: String },
          description: { type: String },
          thumbnail: { type: String },
          image: { type: String },
          author: {
            name: { type: String },
            icon_url: { type: String },
            url: { type: String }
          },
          footer: {
            text: { type: String },
            icon_url: { type: String }
          },
          fields: [
            {
              name: { type: String },
              value: { type: String },
              inline: { type: Boolean }
            }
          ]
        }
      }
    })
  );
