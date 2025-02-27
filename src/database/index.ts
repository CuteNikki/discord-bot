import { PrismaClient } from '@prisma/client';

import logger from 'utility/logger';

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
