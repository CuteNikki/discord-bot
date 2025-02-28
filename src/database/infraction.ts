import { type Infraction } from '@prisma/client';

import { prisma } from 'database/index';

export const createInfraction = async (
  infraction: Omit<Infraction, 'id' | 'createdAt' | 'expiresAt' | 'isActive'> & { expiresAt?: Date; isActive?: boolean },
): Promise<Infraction> =>
  await prisma.infraction.create({
    data: infraction,
  });

export const updateInfraction = async (id: string, data: Partial<Omit<Infraction, 'id' | 'createdAt'>>): Promise<Infraction> =>
  await prisma.infraction.update({
    where: { id },
    data,
  });

export const getInfractionById = async (id: string): Promise<Infraction | null> =>
  await prisma.infraction.findUnique({
    where: { id },
  });

export const getInfractionsByUserId = async (userId: string): Promise<Infraction[] | null> =>
  await prisma.infraction.findMany({
    where: { userId },
  });

export const getInfractionsByGuildId = async (guildId: string): Promise<Infraction[] | null> =>
  await prisma.infraction.findMany({
    where: { guildId },
  });

export const getInfractionsByUserIdAndGuildId = async (userId: string, guildId: string): Promise<Infraction[] | null> =>
  await prisma.infraction.findMany({
    where: { userId, guildId },
  });

export const getInfractionsByModeratorIdAndGuildId = async (moderatorId: string, guildId: string): Promise<Infraction[] | null> =>
  await prisma.infraction.findMany({
    where: { moderatorId, guildId },
  });
