import { getUser, updateUser } from 'database/user';

const userId = '303142922780672013';

const user = await getUser(userId);

console.log('User before update', user);

if (user?.isBanned) {
  console.log('User is banned. Unbanning...');
  const updatedUser = await updateUser(user.userId, { isBanned: false });
  console.log('Updated User', updatedUser);
} else {
  console.log('User is not banned. Banning...');
  const updatedUser = await updateUser(userId, { isBanned: true });
  console.log('Updated User', updatedUser);
}
