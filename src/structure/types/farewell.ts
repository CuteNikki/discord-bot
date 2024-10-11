import type { Types } from 'mongoose';

export type FarewellDocument = {
  _id: Types.ObjectId;
  guildId: string;
  enabled: boolean;
  channelId?: string;
  message: {
    content: string | null;
    embed: {
      color?: string | number | string;
      title?: string;
      url?: string;
      description?: string;
      thumbnail?: string;
      image?: string;
      author?: {
        name?: string;
        icon_url?: string;
        url?: string;
      };
      footer?: {
        text?: string;
        icon_url?: string;
      };
      fields?: {
        name: string;
        value: string;
        inline?: boolean;
      }[];
    };
  };
};
