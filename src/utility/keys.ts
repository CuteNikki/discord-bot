if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in the environment variables');
}
if (!process.env.DISCORD_BOT_TOKEN) {
  throw new Error('DISCORD_BOT_TOKEN is not defined in the environment variables');
}
if (!process.env.DISCORD_BOT_ID) {
  throw new Error('DISCORD_CLIENT_ID is not defined in the environment variables');
}

export const KEYS = {
  DATABASE_URL: process.env.DATABASE_URL,

  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  DISCORD_BOT_ID: process.env.DISCORD_BOT_ID,
  DISCORD_DEV_GUILD_ID: process.env.DISCORD_DEV_GUILD_ID, // Optional

  WEBHOOK_BLACKLIST: process.env.WEBHOOK_BLACKLIST, // Optional

  SUPPORTED_LANGS: ['en-GB', 'en-US', 'de'], // Supported languages
  FALLBACK_LANG: 'en-GB', // Fallback language
};
