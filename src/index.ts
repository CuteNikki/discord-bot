import { getUser, getUsers } from 'database/user';

const users = await getUsers();
console.log(users);

const user = await getUser('303142922780672013');
console.log(user);
