import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import { Player } from 'discord-player';
import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { type UpdateQuery } from 'mongoose';

import i18next from 'i18next';
import i18nextFsBackend from 'i18next-fs-backend';

import { clientModel, type ClientSettings } from 'models/client';
import { guildModel, type GuildSettings } from 'models/guild';
import { userModel, type UserData } from 'models/user';

import type { Button } from 'classes/button';
import type { Command } from 'classes/command';
import type { Modal } from 'classes/modal';

import { loadButtons } from 'loaders/buttons';
import { loadCommands } from 'loaders/commands';
import { loadEvents } from 'loaders/events';
import { loadModals } from 'loaders/modals';

import { initDatabase } from 'utils/database';
import { keys } from 'utils/keys';
import { type Level, type LevelIdentifier } from 'utils/level';
import { initMusicPlayer } from 'utils/player';

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

  public commands = new Collection<string, Command>(); // Collection<commandName, commandData>
  public buttons = new Collection<string, Button>(); // Collection<customId, buttonOptions>
  public modals = new Collection<string, Modal>(); // Collection<customId, modalOptions>

  public cooldowns = new Collection<string, Collection<string, number>>(); // Collection<commandName, Collection<userId, timestamp>>

  public settings = new Collection<string, ClientSettings>(); // Collection<applicationId, settings>

  public guildSettings = new Collection<string, GuildSettings>(); // Collection<guildId, settings>

  public userData = new Collection<string, UserData>(); // Collection<userId, data>
  public userLanguages = new Collection<string, string>(); // Collection<userId, language>

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

    Promise.allSettled([initDatabase(this), initMusicPlayer(this), this.initTranslation(), this.loadModules()]).then(() => {
      this.login(keys.DISCORD_BOT_TOKEN);
    });
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

  public async getGuildSettings(guildId: string): Promise<GuildSettings> {
    const cachedSettings = this.guildSettings.get(guildId);
    if (cachedSettings) return cachedSettings;
    const settings = await guildModel.findOneAndUpdate({ guildId }, {}, { upsert: true, new: true }).lean().exec();
    this.guildSettings.set(guildId, settings);
    return settings;
  }
  public async updateGuildSettings(guildId: string, settings: UpdateQuery<GuildSettings>): Promise<GuildSettings> {
    const newSettings = await guildModel.findOneAndUpdate({ guildId }, settings, { upsert: true, new: true }).lean().exec();
    this.guildSettings.set(guildId, newSettings);
    return newSettings;
  }

  public async getUserLanguage(userId: string | null | undefined): Promise<string> {
    // Return default language if no valid userId is provided
    if (!userId) return this.supportedLanguages[0];

    // Return cached language if found
    const cachedLanguage = this.userLanguages.get(userId);
    if (cachedLanguage) return cachedLanguage;

    // Return language from cached user if found
    const cachedUserData = this.userData.get(userId);
    if (cachedUserData && cachedUserData.language) {
      this.userLanguages.set(userId, cachedUserData.language);
      return cachedUserData.language;
    }

    // Return language from user model if found
    const userData = await userModel.findOne({ userId }, {}, { upsert: false });
    if (userData && userData.language) {
      this.userLanguages.set(userId, userData.language);
      return userData.language;
    }

    // Return default language and set cached language
    this.userLanguages.set(userId, this.supportedLanguages[0]);
    return this.supportedLanguages[0];
  }
  public async updateUserLanguage(userId: string, language: string): Promise<string> {
    const newData = await this.updateUserData(userId, { $set: { language } });
    this.userLanguages.set(userId, newData.language!);
    return newData.language!;
  }

  public async getUserData(userId: string): Promise<UserData> {
    const cachedData = this.userData.get(userId);
    if (cachedData) return cachedData;
    const userData = await userModel.findOneAndUpdate({ userId }, {}, { upsert: true, new: true });
    this.userData.set(userId, userData);
    return userData;
  }
  public async updateUserData(userId: string, userData: UpdateQuery<UserData>): Promise<UserData> {
    const newData = await userModel.findOneAndUpdate({ userId }, userData, { upsert: true, new: true });
    this.userData.set(userId, newData);
    return newData;
  }

  public async getClientSettings(applicationId: string): Promise<ClientSettings> {
    const cachedSettings = this.settings.get(applicationId);
    if (cachedSettings) return cachedSettings;
    const settings = await clientModel.findOneAndUpdate({ applicationId }, {}, { upsert: true, new: true }).lean().exec();
    this.settings.set(applicationId, settings);
    return settings;
  }
  public async updateClientSettings(applicationId: string, settings: UpdateQuery<ClientSettings>): Promise<ClientSettings> {
    const newSettings = await clientModel.findOneAndUpdate({ applicationId }, settings, { upsert: true, new: true }).lean().exec();
    this.settings.set(applicationId, newSettings);
    return newSettings;
  }
}
