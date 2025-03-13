import type { Prisma, User } from '@prisma/client';

import { prisma } from 'database/index';

export const getUsers = () => prisma.user.findMany();

export const getUser = <T extends boolean>(userId: string, include: Prisma.UserInclude = {}, upsert: T = false as T) =>
  upsert
    ? prisma.user.upsert({
        where: { userId },
        update: {},
        create: { userId },
        include,
      })
    : prisma.user.findUnique({
        where: { userId },
        include,
      });

export const updateUser = (userId: string, data: Partial<Omit<User, 'userId'>>) =>
  prisma.user.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
