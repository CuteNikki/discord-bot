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
