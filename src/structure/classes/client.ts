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

  /**
   * Gets or creates the guild settings for a given guild ID
   * @param {string} guildId Guild ID to get the settings for
   * @returns {Promise<GuildSettings>} Guild settings
   */
  public async getGuildSettings(guildId: string): Promise<GuildSettings> {
    return await guildModel.findOneAndUpdate({ guildId }, {}, { upsert: true, new: true }).lean().exec();
  }

  /**
   * Updates the guild settings for a given guild ID
   * @param {string} guildId Guild ID to update the settings for
   * @param {UpdateQuery<GuildSettings>} query Query to update the settings with
   * @returns {Promise<GuildSettings>} Updated guild settings
   */
  public async updateGuildSettings(guildId: string, query: UpdateQuery<GuildSettings>): Promise<GuildSettings> {
    return await guildModel.findOneAndUpdate({ guildId }, query, { upsert: true, new: true }).lean().exec();
  }

  /**
   * Gets the language for a given guild ID
   * @param {string} guildId Guild ID to get the language for
   * @returns {Promise<string>} Language
   */
  public async getGuildLanguage(guildId: string | null | undefined): Promise<string> {
    // Return default language if no valid guildId is provided
    if (!guildId) return supportedLanguages[0];

    // Fetch guild from db and return language
    const guild = await guildModel.findOne({ guildId }, {}, { upsert: false }).lean().exec();
    return guild?.language ?? supportedLanguages[0];
  }

  /**
   * Updates the language for a given guild ID
   * @param {string} guildId Guild ID to update the language for
   * @param {string} language Language to update the guild with
   * @returns {Promise<GuildSettings>} Updated guild
   */
  public async updateGuildLanguage(guildId: string, language: string): Promise<GuildSettings> {
    // If language is not supported, use the default language
    if (!supportedLanguages.includes(language)) language = supportedLanguages[0];

    // Update the guild in db
    return await this.updateGuildSettings(guildId, { $set: { language } });
  }

  /**
   * Gets the language for a given user ID
   * @param {string} userId User ID to get the language for
   * @returns {Promise<string>} Language
   */
  public async getUserLanguage(userId: string | null | undefined): Promise<string> {
    // Return default language if no valid userId is provided
    if (!userId) return supportedLanguages[0];

    // Return language from user db
    const userData = await userModel.findOne({ userId }, {}, { upsert: false }).lean().exec();
    return userData?.language ?? supportedLanguages[0];
  }

  /**
   * Updates the language for a given user ID
   * @param {string} userId User ID to update the language for
   * @param {string} language Language to update the user with
   * @returns {Promise<UserData>} Updated user
   */
  public async updateUserLanguage(userId: string, language: string): Promise<UserData> {
    // If language is not supported, use the default language
    if (!supportedLanguages.includes(language)) language = supportedLanguages[0];

    // Update the user in db
    return await this.updateUserData(userId, { $set: { language } });
  }

  /**
   * Gets the user data for a given user ID
   * @param {string} userId User ID to get the user data for
   * @returns {Promise<UserData>} User data
   */
  public async getUserData(userId: string): Promise<UserData> {
    return await userModel.findOneAndUpdate({ userId }, {}, { upsert: true, new: true });
  }

  /**
   * Updates the user data for a given user ID
   * @param {string} userId User ID to update the user data for
   * @param {UpdateQuery<UserData>} query Query to update the user data with
   * @returns {Promise<UserData>} Updated user data
   */
  public async updateUserData(userId: string, query: UpdateQuery<UserData>): Promise<UserData> {
    return await userModel.findOneAndUpdate({ userId }, query, { upsert: true, new: true });
  }

  /**
   * Gets the client settings for a given application ID
   * @param {string} applicationId Application ID to get the client settings for
   * @returns {Promise<ClientSettings>} Client settings
   */
  public async getClientSettings(applicationId: string): Promise<ClientSettings> {
    return await clientModel.findOneAndUpdate({ applicationId }, {}, { upsert: true, new: true }).lean().exec();
  }

  /**
   * Updates the client settings for a given application ID
   * @param {string} applicationId Application ID to update the client settings for
   * @param {UpdateQuery<ClientSettings>} query Query to update the client settings with
   * @returns {Promise<ClientSettings>} Updated client settings
   */
  public async updateClientSettings(applicationId: string, query: UpdateQuery<ClientSettings>): Promise<ClientSettings> {
    return await clientModel.findOneAndUpdate({ applicationId }, query, { upsert: true, new: true }).lean().exec();
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
