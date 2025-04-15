import { PrismaClient } from '@prisma/client';
import { REST } from 'discord.js';

import { KEYS } from 'utility/keys';
import logger from 'utility/logger';

export const discordRestClient = new REST({ version: '10' }).setToken(KEYS.DISCORD_BOT_TOKEN);

export const prisma = new PrismaClient({
  log: [
    {
      level: 'query',
      emit: 'event',
    },
    {
      level: 'info',
      emit: 'stdout',
    },
    {
      level: 'warn',
      emit: 'stdout',
    },
    {
      level: 'error',
      emit: 'stdout',
    },
  ],
});

prisma.$on('query', (event) => {
  logger.debug({ ...event }, 'Prisma Query');
});
