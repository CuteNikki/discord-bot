import type { Client } from 'discord.js';
import { schedule } from 'node-cron';

import logger from 'utility/logger';

import { deleteExpiredBlacklist } from 'database/blacklist';
import { handleExpiredInfractions } from 'database/infraction';

/*
*
* Coming soon
*

// Run every day at midnight
schedule('0 0 * * *', () => {
  logger.debug('Running cron job (every day at midnight)');
  // coming soon... // Clear daily stats
});

// Run every week on Sunday at midnight
schedule('0 0 * * 0', () => {
  logger.debug('Running cron job (every week on Sunday at midnight)');
  // coming soon... // Clear weekly stats
});

*
*
*/

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function startCron(_client: Client) {
  // Run every minute
  schedule('* * * * *', async () => {
    logger.debug('Running cron job (every minute)');

    await deleteExpiredBlacklist(); // Clear expired user bans
    await handleExpiredInfractions(); // Clear expired infractions
    // coming soon... // Clear expired infractions
    // coming soon... // Clear expired reminders
  });
}
