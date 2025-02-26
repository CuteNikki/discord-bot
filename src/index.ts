import { banUser, getBans, getBansByModerator, unbanUser } from 'database/ban';
import { getUser } from 'database/user';

import 'database/cron';

const userId = '303142922780672013';

const user = await getUser(userId, { banInfo: true }, true);

console.log('User before update', user);

if (user?.banInfo) {
  const deletedBan = await unbanUser(userId);
  console.log('Deleted Ban', deletedBan);
} else {
  const createdBan = await banUser(userId, {
    moderatorId: userId,
    reason: 'Being a bad user',
    // 10 seconds from now
    expiresAt: new Date(Date.now() + 10_000),
  });
  console.log('Created Ban', createdBan);
  //console.log('Banned at', Math.floor(updatedBan.bannedAt.getTime() / 1000));
}

const updatedUser = await getUser(userId, { banInfo: true });
console.log('User after update', updatedUser);

const bansByModerator = await getBansByModerator(userId, { user: true });
console.log('Bans by Moderator', bansByModerator);

const bannedUsers = await getBans({ user: true });
console.log('Banned users', bannedUsers);
