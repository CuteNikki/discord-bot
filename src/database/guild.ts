import type { Guild } from '@prisma/client';

import { prisma } from 'database/index';

export const createGuild = async (guildId: string): Promise<Guild> =>
  await prisma.guild.create({
    data: { guildId },
  });

export const getGuild = async (guildId: string): Promise<Guild | null> =>
  await prisma.guild.findUnique({
    where: { guildId },
  });

export const updateGuild = async (guildId: string, data: Partial<Omit<Guild, 'guildId'>>): Promise<Guild> =>
  await prisma.guild.update({
    where: { guildId },
    data,
  });
