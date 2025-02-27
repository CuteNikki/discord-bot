import type { Blacklist } from '@prisma/client';
import { fetch } from 'bun';

import { prisma } from 'database/index';

import logger from 'utility/logger';

const blacklistWebhookUrl = process.env.WEBHOOK_BLACKLIST;

export const blacklistUser = async (userId: string, blacklist: Omit<Blacklist, 'userId' | 'createdAt'>) => {
  const result = await prisma.blacklist.upsert({
    where: { userId },
    update: blacklist,
    create: { userId, ...blacklist, createdAt: new Date() },
  });

  if (blacklistWebhookUrl) {
    await fetch(blacklistWebhookUrl, {
      method: 'POST',
      body: JSON.stringify({
        username: 'Blacklist',
        embeds: [
          {
            color: 16733751,
            title: 'Blacklist',
            fields: [
              { name: 'User', value: `<@${userId}>`, inline: false },
              { name: 'Moderator', value: `<@${blacklist.moderatorId}>`, inline: false },
              { name: 'Reason', value: blacklist.reason, inline: false },
              {
                name: 'Expires at',
                value: `${blacklist.expiresAt ? `<t:${Math.floor(blacklist.expiresAt.getTime() / 1000)}> (<t:${Math.floor(blacklist.expiresAt.getTime() / 1000)}:R>)` : 'never'}`,
                inline: false,
              },
            ],
          },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => null);
  }

  return result;
};

export const unblacklistUser = async (userId: string) => {
  const result = await prisma.blacklist
    .delete({
      where: { userId },
    })
    .catch(() => null); // Ignore if user is not blacklisted

  if (blacklistWebhookUrl) {
    await fetch(blacklistWebhookUrl, {
      method: 'POST',
      body: JSON.stringify({
        username: 'Unblacklist',
        embeds: [
          {
            color: 5111624,
            title: `Unblacklist`,
            fields: [
              { name: 'User', value: `<@${userId}>`, inline: false },
              { name: 'Moderator', value: `<@${result?.moderatorId}>`, inline: false },
              { name: 'Reason', value: result?.reason, inline: false },
              {
                name: 'Created at',
                value: `<t:${Math.floor((result?.createdAt.getTime() ?? 0) / 1000)}> (<t:${Math.floor((result?.createdAt.getTime() ?? 0) / 1000)}:R>)`,
                inline: false,
              },
            ],
          },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => null);
  }

  return result;
};

export const unblacklistUsers = async (blacklists: Blacklist[]) => {
  const blacklistedIds = blacklists.map((b) => b.userId); // Avoid mapping multiple times

  const result = await prisma.blacklist.deleteMany({
    where: { userId: { in: blacklistedIds } },
  });

  if (blacklistWebhookUrl) {
    await fetch(blacklistWebhookUrl, {
      method: 'POST',
      body: JSON.stringify({
        username: 'Unblacklist',
        embeds: [
          {
            color: 5111624,
            title: `Bulk Unblacklist (${blacklists.length})`,
            description: blacklistedIds.join().slice(0, 3997) + (blacklists.length > 3997 ? '...' : ''),
          },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => null);
  }

  return result;
};

export const getBlacklistByModeratorId = (moderatorId: string, include: { user?: boolean } = {}) =>
  prisma.blacklist.findMany({
    where: { moderatorId },
    include,
  });

export const getBlacklist = (include: { user?: boolean } = {}) =>
  prisma.blacklist.findMany({
    include,
  });

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
