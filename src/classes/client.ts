import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import { Client, Collection, GatewayIntentBits } from 'discord.js';

import i18next from 'i18next';
import i18nextFsBackend from 'i18next-fs-backend';

import { userModel } from 'models/user';

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
  public cluster = new ClusterClient(this);
  public events = new Collection<string, (...args: any[]) => any>();
  public commands = new Collection<string, Command>(); // Collection<commandName, commandData>
  public buttons = new Collection<string, Button>(); // Collection<customId, buttonOptions>
  public modals = new Collection<string, Modal>(); // Collection<customId, modalOptions>
  public cooldowns = new Collection<string, Collection<string, number>>(); // Collection<commandName, Collection<userId, timestamp>>
  public userLanguages = new Collection<string, string>(); // Collection<userId, language>
  public readonly supportedLanguages = ['en', 'de'];
  constructor() {
    super({
      shards: getInfo().SHARD_LIST,
      shardCount: getInfo().TOTAL_SHARDS,
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

  private async loadModules() {
    await loadEvents(this);
    await loadButtons(this);
    await loadModals(this);
    // Make sure to load commands before trying to register them
    await loadCommands(this);
    // We don't want to register commands on every start
    await registerCommands(this);
  }

  public async reload() {
    // Removing all listeners
    // IT IS NOT RECOMMENDED TO USE:
    // client.removeAllListeners();
    // My workaround is saving each of our own listeners and removing them one by one
    for (const [indexWithName, listener] of this.events) {
      const eventName = indexWithName.split('_')[1];
      this.removeListener(eventName, listener);
    }

    this.events = new Collection();
    this.commands = new Collection();
    this.modals = new Collection();
    this.buttons = new Collection();

    await loadEvents(this);
    await loadButtons(this);
    await loadModals(this);
    await loadCommands(this);
    await registerCommands(this);
  }

  private initTranslation() {
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

  public async getLanguage(userId: string | null | undefined): Promise<string> {
    if (!userId) return this.supportedLanguages[0];
    if (this.userLanguages.get(userId)) return this.userLanguages.get(userId) ?? this.supportedLanguages[0];
    const user = await userModel.findOne({ userId }, {}, { upsert: false });
    if (user && user.language) {
      this.userLanguages.set(userId, user.language);
      return user.language;
    }
    return this.supportedLanguages[0];
  }
}
