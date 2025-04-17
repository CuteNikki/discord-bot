import { GatewayIntentBits, Partials } from 'discord.js';

import { ExtendedClient } from 'classes/client';

import { prisma } from 'database/index';

import { startCron } from 'utility/cron';
import { KEYS } from 'utility/keys';
import { initializeI18N } from 'utility/translation';

import { loadButtons } from 'loaders/button';
import { loadCommands } from 'loaders/command';
import { loadEvents } from 'loaders/event';
import { loadModals } from 'loaders/modal';
import { loadSelectMenus } from 'loaders/select';

const client = new ExtendedClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Message],
});

// Running all of this in parallel
await Promise.all([
  prisma.$connect(),
  initializeI18N(),
  startCron(),
  loadCommands(client),
  loadEvents(client),
  loadButtons(client),
  loadModals(client),
  loadSelectMenus(client),
]);

client.login(KEYS.DISCORD_BOT_TOKEN);
