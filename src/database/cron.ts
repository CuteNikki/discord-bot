import cron from 'node-cron';

import { deleteExpiredBans } from 'database/ban';

/*
*
* Coming soon
*

// Run every day at midnight
cron.schedule('0 0 * * *', () => {
  // coming soon... // Clear daily stats
});

// Run every week on Sunday at midnight
cron.schedule('0 0 * * 0', () => {
  // coming soon... // Clear weekly stats
});

*
*
*/

// Run every minute
cron.schedule('* * * * *', async () => {
  await deleteExpiredBans(); // Clear expired user bans
  // coming soon... // Clear expired infractions
  // coming soon... // Clear expired reminders
});
