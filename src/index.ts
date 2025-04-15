import { ActivityType, GatewayIntentBits, Partials, PresenceUpdateStatus } from 'discord.js';

import { ExtendedClient } from 'classes/client';

import { prisma } from 'database/index';

import { loadButtons } from 'utility/buttons';
import { loadCommands } from 'utility/commands';
import { startCron } from 'utility/cron';
import { loadEvents } from 'utility/events';
import { KEYS } from 'utility/keys';

const client = new ExtendedClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Message],
  presence: {
    status: PresenceUpdateStatus.Online,
    activities: [{ name: 'Hello World!', type: ActivityType.Custom }],
  },
});

await Promise.all([prisma.$connect(), loadCommands(client), loadEvents(client), loadButtons(client)]);
startCron();

client.login(KEYS.DISCORD_BOT_TOKEN);
