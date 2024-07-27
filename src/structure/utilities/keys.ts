import config from 'root/config.json';

import { logger } from 'utils/logger';

const keys = {
  DISCORD_BOT_TOKEN: config.DISCORD_BOT.TOKEN ?? 'required',
  DISCORD_BOT_ID: config.DISCORD_BOT.ID ?? 'required',
  DEVELOPER_USER_IDS: config.DEVELOPER.USER_IDS ?? [],
  DEVELOPER_GUILD_IDS: config.DEVELOPER.GUILD_IDS ?? [],
  DEVELOPER_ERROR_WEBHOOK: config.DEVELOPER.ERROR_WEBHOOK ?? 'optional',
  DATABASE_URI: config.DATABASE.URI ?? 'required',
  WEATHER_API_KEY: config.API_KEYS.WEATHER ?? 'required',
};

// Check if config variables are set
if (Object.values(keys).includes('required')) {
  logger.fatal('Required config variables are missing!');
  process.exit(0);
}
// Check for optional config variables
if (Object.values(keys).includes('optional')) logger.warn('There are optional config variables that can be set!');

export { keys };
