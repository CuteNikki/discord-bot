import { banUser, getBans, getBansByModerator, unbanUser } from 'database/ban';
import { getUser } from 'database/user';

import 'database/cron';
import logger from './logger';

const userId = '303142922780672013';

const user = await getUser(userId, { banInfo: true }, true);

logger.info({ data: user }, 'User before update');

if (user?.banInfo) {
  const deletedBan = await unbanUser(userId);
  logger.info({ deletedBan }, 'Deleted Ban');
} else {
  const createdBan = await banUser(userId, {
    moderatorId: userId,
    reason: 'Being a bad user',
    expiresAt: new Date(Date.now() + 10_000), // 10 seconds from now
  });
  logger.info({ data: createdBan }, 'Created Ban');
  logger.info({ data: Math.floor(createdBan.bannedAt.getTime() / 1000) }, 'Banned at');
}

const updatedUser = await getUser(userId, { banInfo: true });
logger.info({ data: updatedUser }, 'User after update');

const bansByModerator = await getBansByModerator(userId, { user: true });
logger.info({ data: bansByModerator }, 'Bans by Moderator');

const bannedUsers = await getBans({ user: true });
logger.info({ data: bannedUsers }, 'Banned users');
