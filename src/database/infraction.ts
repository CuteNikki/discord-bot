import { InfractionType, type Infraction } from '@prisma/client';
import { fetch } from 'bun';

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

export const getInfractionsByUserId = async (userId: string): Promise<Infraction[]> =>
  await prisma.infraction.findMany({
    where: { userId },
  });

export const getInfractionsByGuildId = async (guildId: string): Promise<Infraction[]> =>
  await prisma.infraction.findMany({
    where: { guildId },
  });

export const getInfractionsByUserIdAndGuildId = async (userId: string, guildId: string): Promise<Infraction[]> =>
  await prisma.infraction.findMany({
    where: { userId, guildId },
  });

export const getInfractionsByModeratorIdAndGuildId = async (moderatorId: string, guildId: string): Promise<Infraction[]> =>
  await prisma.infraction.findMany({
    where: { moderatorId, guildId },
  });

export const getExpiredInfractions = async (): Promise<Infraction[]> =>
  await prisma.infraction.findMany({
    where: { expiresAt: { lt: new Date() }, isActive: true },
  });

export const deleteInfraction = async (id: string): Promise<Infraction | null> =>
  await prisma.infraction
    .delete({
      where: { id },
    })
    // If the infraction doesn't exist, return null
    .catch(() => null);

export const handleExpiredInfractions = async (): Promise<void> => {
  const expiredInfractions = await getExpiredInfractions();

  if (!expiredInfractions.length) return;

  for (const infraction of expiredInfractions) {
    // If the infraction is a tempban, unban the user
    if (infraction.type === InfractionType.Tempban) {
      await fetch(`https://discord.com/api/v10/guilds/${infraction.guildId}/bans/${infraction.userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        },
      }).catch(() => null);
    }

    await updateInfraction(infraction.id, { isActive: false });
  }
};
