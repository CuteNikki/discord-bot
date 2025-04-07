import type { Blacklist } from '@prisma/client';
import type { APIUser } from 'discord.js';

import { discordRestClient, prisma } from 'database/index';

import { KEYS } from 'utility/keys';
import logger from 'utility/logger';

export const blacklistUser = async (userId: string, blacklist: Omit<Blacklist, 'userId' | 'createdAt'>) => {
  const result = await prisma.blacklist.upsert({
    where: { userId },
    update: blacklist,
    create: { userId, ...blacklist, createdAt: new Date() },
  });

  if (result && KEYS.WEBHOOK_BLACKLIST) {
    const user = (await discordRestClient.get(`/users/${userId}`).catch(() => null)) as APIUser | null;

    await discordRestClient
      .post(`/${KEYS.WEBHOOK_BLACKLIST}`, {
        body: {
          username: 'Blacklisted User',
          embeds: [
            {
              color: 16733751,
              title: 'Blacklist',
              thumbnail: {
                url: user?.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png` : undefined,
              },
              fields: [
                {
                  name: 'User',
                  value: user?.username
                    ? `${user.global_name ? `${user.global_name} | ${user.username}` : user.username} (<@${userId}>)`
                    : `<@${userId}>`,
                  inline: false,
                },
                { name: 'Moderator', value: `<@${blacklist.moderatorId}>`, inline: false },
                { name: 'Reason', value: blacklist.reason, inline: false },
                {
                  name: 'Expires at',
                  value: `${blacklist.expiresAt ? `<t:${Math.floor(blacklist.expiresAt.getTime() / 1_000)}> (<t:${Math.floor(blacklist.expiresAt.getTime() / 1_000)}:R>)` : 'never'}`,
                  inline: false,
                },
              ],
            },
          ],
        },
      })
      .catch(() => null);
  }

  return result;
};

export const unblacklistUser = async (userId: string) => {
  const result = await prisma.blacklist
    .delete({
      where: { userId },
    })
    .catch(() => null); // Ignore if user is not blacklisted

  if (result && KEYS.WEBHOOK_BLACKLIST) {
    const user = (await discordRestClient.get(`/users/${userId}`).catch(() => null)) as APIUser | null;

    await discordRestClient
      .post(`/${KEYS.WEBHOOK_BLACKLIST}`, {
        body: {
          username: 'Unblacklisted User',
          embeds: [
            {
              color: 5111624,
              title: `Unblacklist`,
              thumbnail: {
                url: user?.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png` : undefined,
              },
              fields: [
                {
                  name: 'User',
                  value: user?.username
                    ? `${user.global_name ? `${user.global_name} | ${user.username}` : user.username} (<@${userId}>)`
                    : `<@${userId}>`,
                  inline: false,
                },
                { name: 'Moderator', value: `<@${result?.moderatorId}>`, inline: false },
                { name: 'Reason', value: result?.reason, inline: false },
                {
                  name: 'Created at',
                  value: `<t:${Math.floor((result?.createdAt.getTime() ?? 0) / 1_000)}> (<t:${Math.floor((result?.createdAt.getTime() ?? 0) / 1_000)}:R>)`,
                  inline: false,
                },
              ],
            },
          ],
        },
      })
      .catch(() => null);
  }

  return result;
};

export const unblacklistUsers = async (blacklists: Blacklist[]) => {
  const blacklistedIds = blacklists.map((b) => b.userId); // Avoid mapping multiple times

  const result = await prisma.blacklist.deleteMany({
    where: { userId: { in: blacklistedIds } },
  });

  if (result && KEYS.WEBHOOK_BLACKLIST) {
    await discordRestClient
      .post(`/${KEYS.WEBHOOK_BLACKLIST}`, {
        body: {
          username: 'Bulk Unblacklist',
          embeds: [
            {
              color: 5111624,
              title: `Bulk Unblacklist (${blacklists.length} user${blacklists.length > 1 || blacklists.length === 0 ? 's' : ''})`,
              description: blacklistedIds.join().slice(0, 3997) + (blacklists.length > 3997 ? '...' : ''),
            },
          ],
        },
      })
      .catch(() => null);
  }

  return result;
};

export const deleteExpiredBlacklist = async () => {
  const blacklistedUsers = await prisma.blacklist.findMany({
    where: { expiresAt: { lt: new Date() } },
  });

  if (blacklistedUsers.length) {
    logger.debug({ data: blacklistedUsers }, 'Expired blacklist entries');

    await unblacklistUsers(blacklistedUsers);
  } else {
    logger.debug('No expired blacklist entries found');
  }
};

export const getBlacklistByModeratorId = (moderatorId: string, include: { user?: boolean } = {}) =>
  prisma.blacklist.findMany({
    where: { moderatorId },
    include,
  });

export const getEntireBlacklist = (include: { user?: boolean } = {}) =>
  prisma.blacklist.findMany({
    include,
  });

export const getBlacklist = async (userId: string) => prisma.blacklist.findUnique({ where: { userId } });
