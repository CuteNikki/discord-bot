import logger from 'utility/logger';

import { blacklistUser, getBlacklist, getBlacklistByModeratorId, unblacklistUser } from 'database/blacklist';
import { getUser } from 'database/user';

import 'database/cron';

const userId = '303142922780672013';

const user = await getUser(userId, { blacklisted: true }, true);

logger.info({ data: user }, 'User before update');

if (user?.blacklisted) {
  // Here if user is blacklisted
  const unblacklistResult = await unblacklistUser(userId);
  logger.info({ data: unblacklistResult }, 'Deleted blacklist entry');
} else {
  // Here if user is not blacklisted
  const blacklistEntry = await blacklistUser(userId, {
    moderatorId: userId,
    reason: 'Being a bad user',
    expiresAt: new Date(Date.now() + 10_000), // 10 seconds from now
  });
  logger.info({ data: blacklistEntry }, 'Created blacklist entry');
  logger.info({ data: Math.floor(blacklistEntry.createdAt.getTime() / 1000) }, 'Banned at');
}

const updatedUser = await getUser(userId, { blacklisted: true });
logger.info({ data: updatedUser }, 'User after update');

const blacklistByModerator = await getBlacklistByModeratorId(userId, { user: true });
logger.info({ data: blacklistByModerator }, 'Blacklist by Moderator');

const blacklistedUsers = await getBlacklist({ user: true });
logger.info({ data: blacklistedUsers }, 'Blacklisted users');
