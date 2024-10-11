import type { UpdateQuery } from 'mongoose';

import { updateGuildSettings } from 'db/guild';
import { moderationModel } from 'models/moderation';

import type { ModerationDocument } from 'types/moderation';

/**
 * Gets the moderation settings for a given guild ID
 * @param {string} guildId Guild ID to get the settings for
 * @param {boolean} insert If true, inserts a new document if none exists (optional, default is false)
 * @returns {Promise<ModerationDocument | null>} Moderation settings
 */
export async function getModeration<T extends boolean>(
  guildId: string,
  insert: T = false as T
): Promise<T extends true ? ModerationDocument : ModerationDocument | null> {
  let document = await moderationModel.findOne({ guildId }).lean().exec();
  if (insert && !document) {
    document = await updateModeration(guildId);
  }
  return document as T extends true ? ModerationDocument : ModerationDocument | null;
}

/**
 * Updates or creates a moderation document for a given guild ID
 * @param {string} guildId Guild ID to create the document for
 * @param {UpdateQuery<ModerationDocument>} query Query to update the document with (optional)
 * @returns {Promise<ModerationDocument>} Updated moderation document
 */
async function updateModeration(guildId: string, query: UpdateQuery<ModerationDocument> = {}): Promise<ModerationDocument> {
  const document = await moderationModel.findOneAndUpdate({ guildId }, query, { upsert: true, new: true }).lean().exec();

  await updateGuildSettings(guildId, { moderation: document._id });

  return document;
}

/**
 * Updates the staffrole for a given guild ID
 * @param {string} guildId Guild ID to update the staffrole for
 * @param {string} staffroleId Staffrole ID to set
 * @returns {Promise<ModerationDocument>} Updated moderation document
 */
export async function setStaffrole(guildId: string, staffroleId: string): Promise<ModerationDocument> {
  return await updateModeration(guildId, { $set: { staffroleId } });
}

/**
 * Makes reasons required for a given guild ID
 * @param {string} guildId Guild ID to make reasons required for
 * @returns {Promise<ModerationDocument>} Updated moderation document
 */
export async function makeReasonsRequired(guildId: string): Promise<ModerationDocument> {
  return await updateModeration(guildId, { $set: { reasonsRequired: true } });
}

/**
 * Makes reasons optional for a given guild ID
 * @param {string} guildId Guild ID to make reasons optional for
 * @returns {Promise<ModerationDocument>} Updated moderation document
 */
export async function makeReasonsOptional(guildId: string): Promise<ModerationDocument> {
  return await updateModeration(guildId, { $set: { reasonsRequired: false } });
}

/**
 * Enable moderation for a given guild ID
 * @param {string} guildId Guild ID to enable moderation for
 * @returns {Promise<ModerationDocument>} Updated moderation document
 */
export async function enableModeration(guildId: string): Promise<ModerationDocument> {
  return await updateModeration(guildId, { $set: { enabled: true } });
}

/**
 * Disable moderation for a given guild ID
 * @param {string} guildId Guild ID to disable moderation for
 * @returns {Promise<ModerationDocument>} Updated moderation document
 */
export async function disableModeration(guildId: string): Promise<ModerationDocument> {
  return await updateModeration(guildId, { $set: { enabled: false } });
}
