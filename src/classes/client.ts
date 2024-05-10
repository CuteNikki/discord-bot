import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import { Client, Collection, GatewayIntentBits } from 'discord.js';

import i18next from 'i18next';
import i18nextFsBackend from 'i18next-fs-backend';

import { guildModel, type Guild } from 'models/guild';
import { userModel } from 'models/user';

import type { Button } from 'classes/button';
import type { Command } from 'classes/command';
import type { Modal } from 'classes/modal';

import { loadButtons } from 'loaders/buttons';
import { loadCommands } from 'loaders/commands';
import { loadEvents } from 'loaders/events';
import { loadModals } from 'loaders/modals';

import { connectDatabase } from 'utils/database';
import { keys } from 'utils/keys';
import type { Level, LevelIdentifier } from 'utils/levels';

export class DiscordClient extends Client {
  public usable = false;
  public cluster = new ClusterClient(this);
  public commands = new Collection<string, Command>(); // Collection<commandName, commandData>
  public buttons = new Collection<string, Button>(); // Collection<customId, buttonOptions>
  public modals = new Collection<string, Modal>(); // Collection<customId, modalOptions>
  public cooldowns = new Collection<string, Collection<string, number>>(); // Collection<commandName, Collection<userId, timestamp>>
  public userLanguages = new Collection<string, string>(); // Collection<userId, language>
  public guildSettings = new Collection<string, Guild>(); // Collection<guildId, settings>
  public levels = new Collection<LevelIdentifier, Level>();
  public levelsWeekly = new Collection<LevelIdentifier, Level>();
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
        GatewayIntentBits.GuildMessages, // !! Needed for levels !!
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
    await loadCommands(this);
    // await registerCommands(this);
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

  public async getGuildSettings(guildId: string): Promise<Guild> {
    const cachedSettings = this.guildSettings.get(guildId);
    if (cachedSettings) return cachedSettings;
    const settings = await guildModel.findOneAndUpdate({ guildId }, {}, { upsert: true, new: true }).lean().exec();
    this.guildSettings.set(guildId, settings);
    return settings;
  }
}
