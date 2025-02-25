import type { BanInfo, User } from '@prisma/client';

import { prisma } from 'database/index';

export const getUsers = async (): Promise<User[]> => prisma.user.findMany();

export const getUser = async <T extends boolean>(
  userId: string,
  include: { banInfo?: boolean } = {},
  upsert: T = false as T
): Promise<T extends true ? User & { banInfo: BanInfo | null } : (User & { banInfo: BanInfo | null }) | null> => {
  if (upsert) {
    const user = await prisma.user.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include,
    });
    return user as T extends true ? User & { banInfo: BanInfo | null } : (User & { banInfo: BanInfo | null }) | null;
  } else {
    const user = await prisma.user.findUnique({
      where: { userId },
      include,
    });
    return user as T extends true ? User & { banInfo: BanInfo | null } : (User & { banInfo: BanInfo | null }) | null;
  }
};

export const createUser = async (userId: string): Promise<User> =>
  prisma.user.create({
    data: { userId },
  });

export const updateUser = async (userId: string, data: Partial<Omit<User, 'userId'>>): Promise<User> =>
  prisma.user.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

export const banUser = async (userId: string, banInfo: Omit<BanInfo, 'userId' | 'bannedAt'>): Promise<BanInfo> =>
  prisma.banInfo.upsert({
    where: { userId },
    update: banInfo,
    create: { userId, ...banInfo, bannedAt: new Date() },
  });

export const unbanUser = async (userId: string): Promise<BanInfo | null> =>
  prisma.banInfo
    .delete({
      where: { userId },
    })
    .catch(() => null);

export const getBansByModerator = async (moderatorId: string): Promise<BanInfo[]> => prisma.banInfo.findMany({ where: { moderatorId } });

export const getBannedUsers = async (): Promise<User[]> =>
  prisma.user.findMany({
    where: { banInfo: { isNot: null } },
    include: { banInfo: true },
  });
