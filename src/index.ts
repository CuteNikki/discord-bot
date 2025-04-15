import { ActivityType, GatewayIntentBits, Partials, PresenceUpdateStatus } from 'discord.js';

import { ExtendedClient } from 'classes/client';

import { prisma } from 'database/index';

import { startCron } from 'utility/cron';
import { KEYS } from 'utility/keys';

import { loadButtons } from 'loaders/button';
import { loadCommands } from 'loaders/command';
import { loadEvents } from 'loaders/event';
import { loadModals } from 'loaders/modal';

const client = new ExtendedClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Message],
  presence: {
    status: PresenceUpdateStatus.Online,
    activities: [{ name: 'Hello World!', type: ActivityType.Custom }],
  },
});

await Promise.all([prisma.$connect(), loadCommands(client), loadEvents(client), loadButtons(client), loadModals(client)]);
startCron();

client.login(KEYS.DISCORD_BOT_TOKEN);
