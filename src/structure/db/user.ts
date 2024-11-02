import type { UpdateQuery } from 'mongoose';

import { userModel } from 'models/user';

import { getUserInfractions } from 'db/infraction';
import { getUserLevels } from 'db/level';

import { BadgeType, fishingRod, pickaxe, type Item, type UserDocument } from 'types/user';

/**
 * Gets the user data for a given user ID
 * @param {string} userId User ID to get the user data for
 * @returns {Promise<UserDocument>} User data
 */
export async function getUser<T extends boolean>(userId: string, insert: T = false as T): Promise<T extends true ? UserDocument : UserDocument | null> {
  let document = await userModel.findOne({ userId }).lean().exec();

  if (!document && insert) {
    document = await updateUser(userId, {});
  }

  return document as T extends true ? UserDocument : UserDocument | null;
}

/**
 * Gets ALL data of a user
 * @param {string} userId User ID to get the user data for
 * @returns {Promise<object>} All data
 */
export async function getUserExport(userId: string): Promise<object> {
  const user = await getUser(userId);
  const levels = await getUserLevels(userId);
  const infractions = await getUserInfractions(userId);

  return {
    ...user,
    infractions,
    ...levels
  };
}

export async function updateUser(userId: string, query: UpdateQuery<UserDocument>) {
  return await userModel.findOneAndUpdate({ userId }, query, { upsert: true, new: true });
}

/**
 * Adds a badge to a user
 * @param {string} userId User ID to add the badge to
 * @param {number} badge Badge to add
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function addBadge(userId: string, badge: BadgeType): Promise<UserDocument> {
  return await updateUser(userId, { $push: { badges: { id: badge, receivedAt: Date.now() } } });
}

/**
 * Removes a badge from a user
 * @param {string} userId User ID to remove the badge from
 * @param {number} badge Badge to remove
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function removeBadge(userId: string, badge: BadgeType): Promise<UserDocument> {
  return await updateUser(userId, { $pull: { badges: { id: badge } } });
}

/**
 * Bans a user
 * @param {string} userId User ID to ban
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function banUser(userId: string): Promise<UserDocument> {
  return await updateUser(userId, { $set: { banned: true } });
}

/**
 * Unban a user
 * @param {string} userId User ID to unban
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function unbanUser(userId: string): Promise<UserDocument> {
  return await updateUser(userId, { $set: { banned: false } });
}

/**
 * Gets all banned users
 * @returns {Promise<UserDocument[]>} Banned users
 */
export async function getBannedUsers(): Promise<UserDocument[]> {
  return await userModel.find({ banned: true }).lean().exec();
}

/**
 * Updates the description of a user
 * @param {string} userId User ID to update the description for
 * @param {string} description Description to set
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function updateDescription(userId: string, description: string): Promise<UserDocument> {
  return await updateUser(userId, { $set: { description } });
}

/**
 * Marries two users
 * @param {string} userIdOne First user ID
 * @param {string} userIdTwo Second user ID
 * @returns {Promise<{ userOne: UserDocument, userTwo: UserDocument}>} Updated user data for both users
 */
export async function marryUsers(userIdOne: string, userIdTwo: string): Promise<{ userOne: UserDocument; userTwo: UserDocument }> {
  const marriedAt = Date.now();

  const updatedUserOne = await updateUser(userIdOne, { $set: { marriedTo: userIdTwo, marriedAt } });
  const updatedUserTwo = await updateUser(userIdOne, { $set: { marriedTo: userIdOne, marriedAt } });

  return { userOne: updatedUserOne, userTwo: updatedUserTwo };
}

/**
 * Divorces two users
 * @param {string} userIdOne First user ID
 * @param {string} userIdTwo Second user ID
 * @returns {Promise<{ userOne: UserDocument, userTwo: UserDocument}>} Updated user data for both users
 */
export async function divorceUsers(userIdOne: string, userIdTwo: string): Promise<{ userOne: UserDocument; userTwo: UserDocument }> {
  const updatedUserOne = await updateUser(userIdOne, { $set: { marriedTo: null, marriedAt: null } });
  const updatedUserTwo = await updateUser(userIdTwo, { $set: { marriedTo: null, marriedAt: null } });

  return { userOne: updatedUserOne, userTwo: updatedUserTwo };
}

/**
 * Adds an item to the inventory of a user
 * @param {string} userId User ID to add the item to
 * @param {Item} item Item to add
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function addItem(userId: string, item: Item): Promise<UserDocument> {
  return await updateUser(userId, { $push: { inventory: item } });
}

/**
 * Adds multiple items to the inventory of a user
 * @param {string} userId User ID to add the items to
 * @param {Item[]} items Items to add
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function addItems(userId: string, items: Item[]): Promise<UserDocument> {
  return await updateUser(userId, { $push: { inventory: { $each: items } } });
}

/**
 * Removes an item from the inventory of a user
 * @param {string} userId User ID to remove the item from
 * @param {number} itemId Item ID to remove
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function removeItem(userId: string, itemId: number): Promise<UserDocument> {
  return await updateUser(userId, { $pull: { inventory: { id: itemId } } });
}

/**
 * Removes multiple items from the inventory of a user
 * @param {string} userId User ID to remove the items from
 * @param {number[]} itemIds Item IDs to remove
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function removeItems(userId: string, itemIds: number[]): Promise<UserDocument> {
  return await updateUser(userId, { $pull: { inventory: { id: { $in: itemIds } } } });
}

/**
 * Deposits money into the bank of a user
 * @param {string} userId User ID to deposit the money into
 * @param {number} amount Amount to deposit
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function deposit(userId: string, amount: number): Promise<UserDocument> {
  return await updateUser(userId, { $inc: { bank: amount, wallet: -amount } });
}

/**
 * Withdraws money from the bank of a user
 * @param {string} userId User ID to withdraw the money from
 * @param {number} amount Amount to withdraw
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function withdraw(userId: string, amount: number): Promise<UserDocument> {
  return await updateUser(userId, { $inc: { bank: -amount, wallet: amount } });
}

/**
 * Adds money to the wallet of a user
 * @param {string} userId User ID to add the money to
 * @param {number} amount Amount to add
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function addMoney(userId: string, amount: number): Promise<UserDocument> {
  return await updateUser(userId, { $inc: { wallet: amount } });
}

/**
 * Removes money from the wallet of a user
 * @param {string} userId User ID to remove the money from
 * @param {number} amount Amount to remove
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function removeMoney(userId: string, amount: number): Promise<UserDocument> {
  return await updateUser(userId, { $inc: { wallet: -amount } });
}

/**
 * Adds money to the wallet of a user
 * @param {string} userId User ID to add the money to
 * @param {number} amount Amount to add
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function addBank(userId: string, amount: number): Promise<UserDocument> {
  return await updateUser(userId, { $inc: { bank: amount } });
}

/**
 * Removes money from the wallet of a user
 * @param {string} userId User ID to remove the money from
 * @param {number} amount Amount to remove
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function removeBank(userId: string, amount: number): Promise<UserDocument> {
  return await updateUser(userId, { $inc: { bank: -amount } });
}

/**
 * The user has completed the economy onboarding
 * @param {string} userId User ID to set the economy onboarding for
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function economyOboarded(userId: string): Promise<UserDocument> {
  return await updateUser(userId, {
    $set: { economyOnboarding: false },
    $push: { inventory: { $each: [pickaxe, fishingRod] } },
    $inc: { bank: 1000 }
  });
}
