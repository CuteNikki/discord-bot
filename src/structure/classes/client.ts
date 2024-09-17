import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import { ActivityType, Client, Collection, Colors, GatewayIntentBits, Partials, PresenceUpdateStatus } from 'discord.js';

import type { UpdateQuery } from 'mongoose';

import { clientModel, type ClientSettings } from 'models/client';
import { customVoiceChannelModel, type CustomVoiceChannel } from 'models/customVoiceChannels';
import { guildModel, type GuildSettings } from 'models/guild';
import { userModel, type UserData } from 'models/user';

import type { Button } from 'classes/button';
import type { Command } from 'classes/command';
import type { Modal } from 'classes/modal';
import type { Selection } from 'classes/selection';

import { loadButtons } from 'loaders/buttons';
import { loadCommands } from 'loaders/commands';
import { loadEvents } from 'loaders/events';
import { loadModals } from 'loaders/modals';
import { loadSelections } from 'loaders/selection';

import { initDatabase } from 'utils/database';
import { listenToErrors } from 'utils/error';
import { keys } from 'utils/keys';
import { initTranslation, supportedLanguages } from 'utils/language';
import type { Level, LevelIdentifier } from 'utils/level';

export class DiscordClient extends Client {
  // Cluster used for sharding from discord-hybrid-sharding
  public cluster = new ClusterClient(this);

  // Collections for loading and running commands, buttons and modals
  public commands = new Collection<string, Command<any>>(); // Collection<commandName, commandData>
  public buttons = new Collection<string, Button>(); // Collection<customId, buttonData>
  public modals = new Collection<string, Modal>(); // Collection<customId, modalData>
  public selections = new Collection<string, Selection>(); // Collection<customId, selectionData>

  // Collection of cooldowns so commands cannot be spammed
  public cooldowns = new Collection<string, Collection<string, number>>(); // Collection<identifier, Collection<userId, timestamp>>

  // Collections for database (used as "cache")
  public settings = new Collection<string, ClientSettings>(); // Collection<applicationId, settings>
  public guildSettings = new Collection<string, GuildSettings>(); // Collection<guildId, settings>
  public guildLanguages = new Collection<string, string>(); // Collection<guildId, language>
  public userData = new Collection<string, UserData>(); // Collection<userId, data>
  public userLanguages = new Collection<string, string>(); // Collection<userId, language>
  public level = new Collection<LevelIdentifier, Level>(); // Collection<{guildId, userId}, {level, xp}>
  public levelWeekly = new Collection<LevelIdentifier, Level>(); // Collection<{guildId, userId}, {level, xp}>

  // Custom colors
  public colors = {
    error: Colors.Red,
    warning: Colors.Yellow,
    success: Colors.Green,
    counting: Colors.Blue,
    farewell: Colors.Orange,
    welcome: Colors.DarkAqua,
    utilities: Colors.Aqua,
    customVC: Colors.Purple,
    phone: Colors.Gold,
  };

  // Custom emojis
  public customEmojis: {
    [key: string]: string;
  } = {};

  constructor() {
    super({
      // Setting the bot shards from discord-hybrid-sharding
      shards: getInfo().SHARD_LIST,
      shardCount: getInfo().TOTAL_SHARDS,
      // Setting the bots presence
      presence: {
        activities: keys.DISCORD_BOT_STATUS !== 'optional' ? [{ name: keys.DISCORD_BOT_STATUS, type: ActivityType.Custom }] : [],
        status: PresenceUpdateStatus.Online,
      },
      // Partials are a way to handle objects that may not have all their data available
      // By enabling partials, your bot can still process events involving these incomplete objects by fetching additional data when needed
      partials: [
        Partials.Reaction,
        Partials.Message,
        Partials.Channel,
        Partials.GuildScheduledEvent,
        Partials.GuildMember,
        Partials.ThreadMember,
        Partials.User,
      ],
      // Intents are a way to specify which events your bot should receive from the Discord gateway
      intents: [
        // !! Needed for guilds, channels, roles and messages !!
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages, // !! Needed for phone to work in DMs !!

        // !! Needed for guild log !!
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.AutoModerationExecution,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildScheduledEvents,

        // !! Needed to keep track of bans !!
        // Without this users will show up as banned after being unbanned
        GatewayIntentBits.GuildModeration,

        // !! Privileged intents !!
        // Some intents are considered "privileged" and require additional permissions or approval from Discord:
        GatewayIntentBits.GuildMembers, // !! Needed for welcome messages and guild log !!
        GatewayIntentBits.MessageContent, // !! Needed for fast-type game !!
        GatewayIntentBits.GuildPresences,
      ],
    });

    // Loading everything and logging in once everything is loaded
    Promise.allSettled([this.loadModules(), initTranslation(), initDatabase(this), listenToErrors(this)]).then(() => {
      this.login(keys.DISCORD_BOT_TOKEN);
    });
  }

  private async loadModules() {
    await Promise.allSettled([loadEvents(this), loadCommands(this), loadButtons(this), loadModals(this), loadSelections(this)]);
  }

  public async getGuildSettings(guildId: string): Promise<GuildSettings> {
    // Return guild settings from collection if found
    const settingsInCollection = this.guildSettings.get(guildId);
    if (settingsInCollection) return settingsInCollection;

    // Getting guild settings from model and setting collection
    const settings = await guildModel.findOneAndUpdate({ guildId }, {}, { upsert: true, new: true }).lean().exec();
    this.guildSettings.set(guildId, settings);

    // Return settings
    return settings;
  }

  public async updateGuildSettings(guildId: string, query: UpdateQuery<GuildSettings>): Promise<GuildSettings> {
    // Update settings in model and setting collection
    const updatedSettings = await guildModel.findOneAndUpdate({ guildId }, query, { upsert: true, new: true }).lean().exec();
    this.guildSettings.set(guildId, updatedSettings);

    // Return updated settings
    return updatedSettings;
  }

  public async getGuildLanguage(guildId: string | null | undefined): Promise<string> {
    // Return default language if no valid userId is provided
    if (!guildId) return supportedLanguages[0];

    // Return language from language collection if found
    const languageInCollection = this.guildLanguages.get(guildId);
    if (languageInCollection) return languageInCollection;

    // Return language from guild settings collection if found
    const guildDataInCollection = this.guildSettings.get(guildId);
    if (guildDataInCollection && guildDataInCollection.language) {
      // Setting language collection and returning language
      this.guildLanguages.set(guildId, guildDataInCollection.language);
      return guildDataInCollection.language;
    }

    // Set language collection and return default language
    this.guildLanguages.set(guildId, supportedLanguages[0]);
    return supportedLanguages[0];
  }

  public async updateGuildLanguage(userId: string, language: string): Promise<string> {
    // If language is not supported, use the default language
    if (!supportedLanguages.includes(language)) language = supportedLanguages[0];

    // Update the guild data model and language collection
    await this.updateGuildSettings(userId, { $set: { language } });
    this.guildLanguages.set(userId, language);

    // Return language
    return language;
  }

  public async getUserLanguage(userId: string | null | undefined): Promise<string> {
    // Return default language if no valid userId is provided
    if (!userId) return supportedLanguages[0];

    // Return language from language collection if found
    const languageInCollection = this.userLanguages.get(userId);
    if (languageInCollection) return languageInCollection;

    // Return language from user collection if found
    const userDataInCollection = this.userData.get(userId);
    if (userDataInCollection && userDataInCollection.language) {
      // Setting language collection and returning language
      this.userLanguages.set(userId, userDataInCollection.language);
      return userDataInCollection.language;
    }

    // Return language from user model if found
    const userData = await userModel.findOne({ userId }, {}, { upsert: false });
    if (userData && userData.language) {
      // Setting language collection and returning language
      this.userLanguages.set(userId, userData.language);
      return userData.language;
    }

    // Set language collection and return default language
    this.userLanguages.set(userId, supportedLanguages[0]);
    return supportedLanguages[0];
  }

  public async updateUserLanguage(userId: string, language: string): Promise<string> {
    // If language is not supported, use the default language
    if (!supportedLanguages.includes(language)) language = supportedLanguages[0];

    // Update the user data model and language collection
    await this.updateUserData(userId, { $set: { language } });
    this.userLanguages.set(userId, language);

    // Return language
    return language;
  }

  public async getUserData(userId: string): Promise<UserData> {
    // Return user data from collection if found
    const userDataInCollection = this.userData.get(userId);
    if (userDataInCollection) return userDataInCollection;

    // Getting user data from model and setting collection
    const userData = await userModel.findOneAndUpdate({ userId }, {}, { upsert: true, new: true });
    this.userData.set(userId, userData);

    // Return user data
    return userData;
  }

  public async updateUserData(userId: string, query: UpdateQuery<UserData>): Promise<UserData> {
    // Updating user data in model and setting collection
    const updatedUserData = await userModel.findOneAndUpdate({ userId }, query, { upsert: true, new: true });
    this.userData.set(userId, updatedUserData);

    // Return updated user data
    return updatedUserData;
  }

  public async getClientSettings(applicationId: string): Promise<ClientSettings> {
    // Return client settings from collection if found
    const settingsInCollection = this.settings.get(applicationId);
    if (settingsInCollection) return settingsInCollection;

    // Get client settings from model and setting collection
    const settings = await clientModel.findOneAndUpdate({ applicationId }, {}, { upsert: true, new: true }).lean().exec();
    this.settings.set(applicationId, settings);

    // Return settings
    return settings;
  }

  public async updateClientSettings(applicationId: string, query: UpdateQuery<ClientSettings>): Promise<ClientSettings> {
    // Updating client settings in model and setting collection
    const updatedSettings = await clientModel.findOneAndUpdate({ applicationId }, query, { upsert: true, new: true }).lean().exec();
    this.settings.set(applicationId, updatedSettings);

    // Return updated settings
    return updatedSettings;
  }

  /**
   * Gets the custom voice channel data for a given channel ID
   * @param {string} channelId Channel ID to get the custom voice channel data for
   * @returns {Promise<CustomVoiceChannel | null>} CustomVoiceChannel data or null if not found
   */
  public async getCustomVoiceChannel(channelId: string): Promise<CustomVoiceChannel | null> {
    return await customVoiceChannelModel.findOne({ channelId }, {}, { upsert: false }).lean().exec();
  }

  /**
   * Gets the custom voice channel data for a given owner ID
   * @param {string} ownerId Owner ID to get the custom voice channel data for
   * @returns {Promise<CustomVoiceChannel | null>} CustomVoiceChannel or null if not found
   */
  public async getCustomVoiceChannelByOwner(ownerId: string): Promise<CustomVoiceChannel | null> {
    return await customVoiceChannelModel.findOne({ ownerId }, {}, { upsert: false }).lean().exec();
  }

  /**
   * Gets all custom voice channels
   * @returns {Promise<CustomVoiceChannel[]>} An array of CustomVoiceChannel data
   */
  public async getCustomVoiceChannels(): Promise<CustomVoiceChannel[]> {
    return await customVoiceChannelModel.find().lean().exec();
  }

  /**
   * Gets all custom voice channels that belong to a given guild
   * @param {string} guildId Guild ID to get the custom voice channels for
   * @returns {Promise<CustomVoiceChannel[]>} An array of CustomVoiceChannel data
   */
  public async getCustomVoiceChannelsByGuild(guildId: string): Promise<CustomVoiceChannel[]> {
    return await customVoiceChannelModel.find({ guildId }).lean().exec();
  }

  /**
   * Updates a custom voice channel
   * @param {string} channelId Channel ID to update
   * @param {UpdateQuery<CustomVoiceChannel>} query Query to update the custom voice channel with
   * @returns {Promise<CustomVoiceChannel>} updated CustomVoiceChannel
   */
  public async updateCustomVoiceChannel(channelId: string, query: UpdateQuery<CustomVoiceChannel>): Promise<CustomVoiceChannel> {
    return await customVoiceChannelModel.findOneAndUpdate({ channelId }, query, { upsert: true, new: true }).lean().exec();
  }

  /**
   * Deletes a custom voice channel
   * @param {string} channelId Channel ID to delete
   * @returns {Promise<CustomVoiceChannel | null>} Deleted CustomVoiceChannel or null if not found
   */
  public async deleteCustomVoiceChannel(channelId: string): Promise<CustomVoiceChannel | null> {
    return await customVoiceChannelModel.findOneAndDelete({ channelId }, { upsert: false }).lean().exec();
  }

  /**
   * Create a new custom voice channel
   * @param {string} channelId Channel ID to create the custom voice channel for
   * @param {string} guildId Guild ID to create the custom voice channel for
   * @param {string} ownerId Owner ID to create the custom voice channel for
   * @returns {Promise<CustomVoiceChannel>} Created CustomVoiceChannel
   */
  public async createCustomVoiceChannel(channelId: string, guildId: string, ownerId: string): Promise<CustomVoiceChannel> {
    return await customVoiceChannelModel.findOneAndUpdate({ channelId }, { $set: { ownerId, guildId } }, { upsert: true, new: true }).lean().exec();
  }
}
