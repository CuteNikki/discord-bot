import type { BanInfo } from '@prisma/client';

import { prisma } from 'database/index';

export const banUser = (userId: string, banInfo: Omit<BanInfo, 'userId' | 'bannedAt'>) =>
  prisma.banInfo.upsert({
    where: { userId },
    update: banInfo,
    create: { userId, ...banInfo, bannedAt: new Date() },
  });

export const unbanUser = (userId: string) =>
  prisma.banInfo
    .delete({
      where: { userId },
    })
    .catch(() => null);

export const getBansByModerator = (moderatorId: string, include: { user?: boolean } = {}) =>
  prisma.banInfo.findMany({
    where: { moderatorId },
    include,
  });

export const getBans = (include: { user?: boolean } = {}) =>
  prisma.banInfo.findMany({
    include,
  });

export const deleteExpiredBans = () =>
  prisma.banInfo.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
