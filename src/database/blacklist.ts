import type { Blacklist } from '@prisma/client';

import { prisma } from 'database/index';

import logger from 'utility/logger';

export const blacklistUser = (userId: string, banInfo: Omit<Blacklist, 'userId' | 'createdAt'>) =>
  prisma.blacklist.upsert({
    where: { userId },
    update: banInfo,
    create: { userId, ...banInfo, createdAt: new Date() },
  });

export const unblacklistUser = (userId: string) =>
  prisma.blacklist
    .delete({
      where: { userId },
    })
    .catch(() => null);

export const unblacklistUsers = (userIds: string[]) =>
  prisma.blacklist.deleteMany({
    where: { userId: { in: userIds } },
  });

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

    await unblacklistUsers(blacklistedUsers.map((user) => user.userId));
  } else {
    logger.debug('No expired blacklist entries found');
  }
};
