import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import { Player } from 'discord-player';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';

import i18next from 'i18next';
import i18nextFsBackend from 'i18next-fs-backend';

import { guildModel, type Guild } from 'models/guild';
import { userModel, type User } from 'models/user';

import type { Button } from 'classes/button';
import type { Command } from 'classes/command';
import type { Modal } from 'classes/modal';

import { loadButtons } from 'loaders/buttons';
import { loadCommands } from 'loaders/commands';
import { loadEvents } from 'loaders/events';
import { loadModals } from 'loaders/modals';

import { connectDatabase } from 'utils/database';
import { keys } from 'utils/keys';
import type { Level, LevelIdentifier } from 'utils/level';
import { managePlayer } from 'utils/player';

export class DiscordClient extends Client {
  public cluster = new ClusterClient(this);
  public player = new Player(this, {
    skipFFmpeg: false,
    useLegacyFFmpeg: false,
    ytdlOptions: {
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
    },
  });

  public usable = false;

  public commands = new Collection<string, Command>(); // Collection<commandName, commandData>
  public buttons = new Collection<string, Button>(); // Collection<customId, buttonOptions>
  public modals = new Collection<string, Modal>(); // Collection<customId, modalOptions>

  public cooldowns = new Collection<string, Collection<string, number>>(); // Collection<commandName, Collection<userId, timestamp>>

  public userLanguages = new Collection<string, string>(); // Collection<userId, language>
  public guildSettings = new Collection<string, Guild>(); // Collection<guildId, settings>
  public userSettings = new Collection<string, User>(); // Collection<userId, settings>
  public level = new Collection<LevelIdentifier, Level>();
  public levelWeekly = new Collection<LevelIdentifier, Level>();

  public readonly supportedLanguages = ['en', 'de'];

  constructor() {
    super({
      shards: getInfo().SHARD_LIST,
      shardCount: getInfo().TOTAL_SHARDS,
      partials: [
        Partials.Reaction,
        Partials.Message,
        Partials.Channel,
        Partials.GuildScheduledEvent,
        Partials.GuildMember,
        Partials.ThreadMember,
        Partials.User,
      ],
      intents: [
        // !! Needed for guilds, channels, roles and messages !!
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,

        // !! Needed for guild log !!
        GatewayIntentBits.GuildVoiceStates, // !! also needed for music module !!
        GatewayIntentBits.AutoModerationExecution,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildScheduledEvents,

        // !! Needed to keep track of bans !!
        GatewayIntentBits.GuildModeration,
        // Without this intent users will show up as banned after being unbanned

        // privileged intents:
        GatewayIntentBits.GuildMembers, // !! Needed for welcome messages and guild log !!
        GatewayIntentBits.GuildPresences, // !! Needed for userinfo !!
        GatewayIntentBits.MessageContent, // !! Needed for fast-type game !!
        // Without this intent MessageContextMenuCommands will still have message.content
      ],
    });

    // Connect to database
    connectDatabase(this);

    // Setting up the music player
    managePlayer(this);

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

  public async getUserSettings(userId: string): Promise<User> {
    const cachedSettings = this.userSettings.get(userId);
    if (cachedSettings) return cachedSettings;
    const settings = await userModel.findOneAndUpdate({ userId }, {}, { upsert: true, new: true });
    this.userSettings.set(userId, settings);
    return settings;
  }
}
