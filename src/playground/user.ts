import { getUserOrCreate } from 'database/user';

import logger from 'utility/logger';

const userIds = ['303142922780672013', '787729763035906099'];

for (const userId of userIds) {
  const user = await getUserOrCreate(userId);
  logger.info({ data: user }, 'User Data');
}
