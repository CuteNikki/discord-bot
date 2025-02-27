import cron from 'node-cron';

import logger from 'utility/logger';

import { deleteExpiredBlacklist } from 'database/blacklist';

/*
*
* Coming soon
*

// Run every day at midnight
cron.schedule('0 0 * * *', () => {
  logger.debug('Running cron job (every day at midnight)');
  // coming soon... // Clear daily stats
});

// Run every week on Sunday at midnight
cron.schedule('0 0 * * 0', () => {
  logger.debug('Running cron job (every week on Sunday at midnight)');
  // coming soon... // Clear weekly stats
});

*
*
*/

// Run every minute
cron.schedule('* * * * *', async () => {
  logger.debug('Running cron job (every minute)');

  await deleteExpiredBlacklist(); // Clear expired user bans
  // coming soon... // Clear expired infractions
  // coming soon... // Clear expired reminders
});
