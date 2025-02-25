import type { User } from '@prisma/client';

import { prisma } from 'database/index';

export const getUsers = async (): Promise<User[]> => {
  return await prisma.user.findMany();
};

export const getUser = async (userId: string): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: { userId },
  });
};
