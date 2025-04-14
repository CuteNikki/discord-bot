import type { Prisma, User } from '@prisma/client';

import { prisma } from 'database/index';

export const getUsers = () => prisma.user.findMany();

export const getUser = async <T extends Prisma.UserInclude>(userId: string, include?: T) =>
  (await prisma.user.findUnique({
    where: { userId },
    include,
  })) as Prisma.UserGetPayload<{ include: T }> | null;

export const getUserOrCreate = async <T extends Prisma.UserInclude>(userId: string, include?: T) =>
  (await prisma.user.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include,
  })) as Prisma.UserGetPayload<{ include: T }>;

export const updateUser = (userId: string, data: Partial<Omit<User, 'userId'>>) =>
  prisma.user.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
