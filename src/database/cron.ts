import cron from 'node-cron';

import { deleteExpiredBans } from 'database/ban';

// Run every day at midnight
cron.schedule('0 0 * * *', () => {});

// Run every minute
cron.schedule('* * * * *', async () => await deleteExpiredBans());
