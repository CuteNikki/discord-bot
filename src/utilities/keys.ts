import config from '../../config.json';

const keys = {
  DISCORD_BOT_TOKEN: config.DISCORD_BOT.TOKEN ?? 'value_not_found',
  DISCORD_BOT_ID: config.DISCORD_BOT.ID ?? 'value_not_found',
  DEVELOPER_USER_IDS: config.DEVELOPER.USER_IDS ?? [],
  DEVELOPER_GUILD_IDS: config.DEVELOPER.GUILD_IDS ?? [],
  DATABASE_URI: config.DATABASE.URI ?? 'value_not_found',
  WEATHER_API_KEY: config.API_KEYS.WEATHER ?? 'value_not_found',
};

export { keys };
