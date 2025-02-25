import type { BanInfo, User } from '@prisma/client';

import { prisma } from 'database/index';

export const getUsers = () => prisma.user.findMany();

export const getUser = <T extends boolean>(userId: string, include: { banInfo?: boolean } = {}, upsert: T = false as T) =>
  (upsert
    ? prisma.user.upsert({
        where: { userId },
        update: {},
        create: { userId },
        include,
      })
    : prisma.user.findUnique({
        where: { userId },
        include,
      })) as Promise<T extends true ? User & { banInfo: BanInfo | null } : (User & { banInfo: BanInfo | null }) | null>;

export const createUser = (userId: string) =>
  prisma.user.create({
    data: { userId },
  });

export const updateUser = (userId: string, data: Partial<Omit<User, 'userId'>>) =>
  prisma.user.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

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
