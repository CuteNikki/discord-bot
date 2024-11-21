import type { Types } from 'mongoose';

import type { Item } from 'types/user';

export type ClientDocument = {
  _id: Types.ObjectId;
  applicationId: string;
  database: {
    lastWeeklyClearAt: number;
  };
  support: {
    guildId: string;
    guildInvite: string;
    botInvite: string;
  };
  stats: {
    restarts: number;
    commandsExecuted: number;
    commandsFailed: number;
    buttonsExecuted: number;
    buttonsFailed: number;
    guildsJoined: number;
    guildsLeft: number;
  };
  shop: ShopItem[];
};

export type ShopItem = Item & {
  buyPrice: number;
  sellPrice: number;
};
