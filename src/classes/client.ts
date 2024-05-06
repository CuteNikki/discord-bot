import { Client, Collection, GatewayIntentBits } from 'discord.js';

import i18next from 'i18next';
import i18nextFsBackend from 'i18next-fs-backend';

import type { Button } from 'classes/button';
import type { Command } from 'classes/command';
import type { Modal } from 'classes/modal';

import { loadButtons } from 'loaders/buttons';
import { loadCommands, registerCommands } from 'loaders/commands';
import { loadEvents } from 'loaders/events';
import { loadModals } from 'loaders/modals';

import { connectDatabase } from 'utils/database';
import { keys } from 'utils/keys';

export class DiscordClient extends Client {
  commands = new Collection<string, Command>(); // Collection<commandName, commandData>
  buttons = new Collection<string, Button>(); // Collection<customId, buttonOptions>
  modals = new Collection<string, Modal>(); // Collection<customId, modalOptions>
  cooldowns = new Collection<string, Collection<string, number>>(); // Collection<commandName, Collection<userId, timestamp>>
  userLanguages = new Collection<string, string>(); // Collection<userId, language>
  supportedLanguages = ['en', 'de'];

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds, // !! Needed for guilds, channels and roles !!
        GatewayIntentBits.GuildModeration, // !! Needed to keep track of bans !!
        // (If a user gets banned and then unbanned they will still show up as banned in the cache without this intent)

        // privileged intents:
        // GatewayIntentBits.GuildMembers, // !! Needed for welcome messages !!
        GatewayIntentBits.GuildPresences, // !! Needed for userinfo !!
        // GatewayIntentBits.MessageContent // Not needed as we are not reading messages and only replying to interactions
        // (MessageContextMenuCommands will still have readable message.content without this intent)
      ],
    });

    // Connect to database
    connectDatabase(this);

    // Initialize i18next
    this.initTranslation();

    // Load all modules
    this.loadModules();

    // Login with token
    this.login(keys.DISCORD_BOT_TOKEN);
  }

  async loadModules() {
    await loadEvents(this);
    await loadButtons(this);
    await loadModals(this);
    // Make sure to load commands before trying to register them
    await loadCommands(this);
    await registerCommands(this);
  }

  async reload() {
    await loadButtons(this);
    await loadButtons(this);
    await loadModals(this);
    await loadCommands(this);
    await registerCommands(this);
  }

  initTranslation() {
    i18next.use(i18nextFsBackend).init({
      // debug: true,
      preload: this.supportedLanguages,
      fallbackLng: this.supportedLanguages[0],
      interpolation: {
        escapeValue: false,
      },
      backend: {
        loadPath: 'src/locales/{{lng}}/{{ns}}.json',
      },
    });
  }

  getLanguage(userId: string | null | undefined) {
    // Get a users language preference or return en if not set
    return this.userLanguages.get(userId ?? '') ?? 'en';
  }
}
