import { PrismaClient } from '@prisma/client';
import { REST } from 'discord.js';

import logger from 'utility/logger';

if (!process.env.DISCORD_BOT_TOKEN) {
  logger.error('No DISCORD_BOT_TOKEN provided');
  process.exit(1);
}

export const discordRestClient = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

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

prisma.$on('query', (e) => {
  logger.debug(`Query: ${e.query} | Duration: ${e.duration}ms`);
});
