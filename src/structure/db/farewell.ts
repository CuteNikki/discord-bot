import type { UpdateQuery } from 'mongoose';

import { updateGuild } from 'db/guild';
import { farewellModel } from 'models/farewell';

import type { FarewellDocument } from 'types/farewell';

export async function getFarewell<T extends boolean>(
  guildId: string,
  insert: T = false as T
): Promise<T extends true ? FarewellDocument : FarewellDocument | null> {
  let document = await farewellModel.findOne({ guildId }).lean().exec();

  if (!document && insert) {
    document = await updateFarewell(guildId, {});
  }

  return document as T extends true ? FarewellDocument : FarewellDocument | null;
}

async function updateFarewell(guildId: string, query: UpdateQuery<FarewellDocument>): Promise<FarewellDocument> {
  const document = await farewellModel.findOneAndUpdate({ guildId }, query, { upsert: true, new: true }).lean().exec();

  await updateGuild(guildId, { $set: { farewell: document._id } });

  return document;
}

export async function updateFarewellChannel(guildId: string, channelId: string): Promise<FarewellDocument> {
  return updateFarewell(guildId, { $set: { channelId } });
}

export async function updateFarewellMessage(guildId: string, message: string): Promise<FarewellDocument> {
  return updateFarewell(guildId, { $set: { message } });
}

export async function enableFarewell(guildId: string): Promise<FarewellDocument> {
  return updateFarewell(guildId, { $set: { enabled: true } });
}

export async function disableFarewell(guildId: string): Promise<FarewellDocument> {
  return updateFarewell(guildId, { $set: { enabled: false } });
}

export async function removeFarewellChannel(guildId: string): Promise<FarewellDocument> {
  return updateFarewell(guildId, { $set: { channelId: undefined } });
}