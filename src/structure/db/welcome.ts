import type { UpdateQuery } from 'mongoose';

import { updateGuild } from 'db/guild';
import { welcomeModel } from 'models/welcome';

import type { WelcomeDocument } from 'types/welcome';

export async function getWelcome<T extends boolean>(
  guildId: string,
  insert: T = false as T
): Promise<T extends true ? WelcomeDocument : WelcomeDocument | null> {
  let document = await welcomeModel.findOne({ guildId }).lean().exec();

  if (!document && insert) {
    document = await updateWelcome(guildId, {});
  }

  return document as T extends true ? WelcomeDocument : WelcomeDocument | null;
}

export async function updateWelcome(guildId: string, query: UpdateQuery<WelcomeDocument>): Promise<WelcomeDocument> {
  const document = await welcomeModel.findOneAndUpdate({ guildId }, query, { upsert: true, new: true }).lean().exec();

  await updateGuild(guildId, { $set: { welcome: document._id } });

  return document;
}

export async function updateWelcomeChannel(guildId: string, channelId: string): Promise<WelcomeDocument> {
  return updateWelcome(guildId, { $set: { channelId } });
}

export async function updateWelcomeMessage(guildId: string, message: string): Promise<WelcomeDocument> {
  return updateWelcome(guildId, { $set: { message } });
}

export async function enableWelcome(guildId: string): Promise<WelcomeDocument> {
  return updateWelcome(guildId, { $set: { enabled: true } });
}

export async function disableWelcome(guildId: string): Promise<WelcomeDocument> {
  return updateWelcome(guildId, { $set: { enabled: false } });
}

export async function removeWelcomeChannel(guildId: string): Promise<WelcomeDocument> {
  return updateWelcome(guildId, { $set: { channelId: undefined } });
}

export async function addWelcomeRole(guildId: string, roleId: string): Promise<WelcomeDocument> {
  return updateWelcome(guildId, { $push: { roles: roleId } });
}

export async function removeWelcomeRole(guildId: string, roleId: string): Promise<WelcomeDocument> {
  return updateWelcome(guildId, { $pull: { roles: roleId } });
}
