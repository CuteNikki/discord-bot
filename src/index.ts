import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';

import { ExtendedClient } from 'classes/client';

import { prisma } from 'database/index';

import { loadCommands } from 'utility/commands';
import { startCron } from 'utility/cron';
import { loadEvents } from 'utility/events';
import logger from 'utility/logger';

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  logger.error('No DISCORD_BOT_TOKEN provided');
  process.exit(1);
}

const client = new ExtendedClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Message],
  presence: {
    activities: [{ name: 'Hello World!', type: ActivityType.Custom }],
  },
});

await prisma.$connect();
await loadCommands(client);
await loadEvents(client);
startCron();

client.login(token);
