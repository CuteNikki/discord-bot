import { banUser, getBans, getBansByModerator, unbanUser } from 'database/ban';
import { getUser } from 'database/user';

import 'database/cron';
import logger from './logger';

const userId = '303142922780672013';

const user = await getUser(userId, { banInfo: true }, true);

logger.debug({ data: user }, 'User before update');

if (user?.banInfo) {
  const deletedBan = await unbanUser(userId);
  logger.debug({ deletedBan }, 'Deleted Ban');
} else {
  const createdBan = await banUser(userId, {
    moderatorId: userId,
    reason: 'Being a bad user',
    expiresAt: new Date(Date.now() + 10_000), // 10 seconds from now
  });
  logger.debug({ data: createdBan }, 'Created Ban');
  logger.debug({ data: Math.floor(createdBan.bannedAt.getTime() / 1000) }, 'Banned at');
}

const updatedUser = await getUser(userId, { banInfo: true });
logger.debug({ data: updatedUser }, 'User after update');

const bansByModerator = await getBansByModerator(userId, { user: true });
logger.debug({ data: bansByModerator }, 'Bans by Moderator');

const bannedUsers = await getBans({ user: true });
logger.debug({ data: bannedUsers }, 'Banned users');
