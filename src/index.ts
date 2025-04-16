import { GatewayIntentBits, Partials } from 'discord.js';
import { use } from 'i18next';
import I18NexFsBackend from 'i18next-fs-backend';

import { ExtendedClient } from 'classes/client';

import { prisma } from 'database/index';

import { startCron } from 'utility/cron';
import { KEYS } from 'utility/keys';

import { loadButtons } from 'loaders/button';
import { loadCommands } from 'loaders/command';
import { loadEvents } from 'loaders/event';
import { loadModals } from 'loaders/modal';
import { loadSelectMenus } from 'loaders/select';

const client = new ExtendedClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Message],
});

await use(I18NexFsBackend).init({
  debug: process.argv.includes('--debug-lang'),
  defaultNS: 'messages',
  ns: ['messages', 'commands'],
  preload: KEYS.SUPPORTED_LANGS,
  fallbackLng: KEYS.FALLBACK_LANG,
  interpolation: {
    escapeValue: false,
  },
  backend: {
    loadPath: './src/locales/{{lng}}/{{ns}}.json',
  },
});

await Promise.all([
  prisma.$connect(),
  startCron(),
  loadCommands(client),
  loadEvents(client),
  loadButtons(client),
  loadModals(client),
  loadSelectMenus(client),
]);

client.login(KEYS.DISCORD_BOT_TOKEN);
