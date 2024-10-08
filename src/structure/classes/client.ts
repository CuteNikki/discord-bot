import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import { ActivityType, Client, Collection, Colors, GatewayIntentBits, Partials, PresenceUpdateStatus } from 'discord.js';

import type { Button } from 'classes/button';
import type { Command } from 'classes/command';
import type { Modal } from 'classes/modal';
import type { Selection } from 'classes/selection';

import { loadButtons } from 'loaders/buttons';
import { loadCommands } from 'loaders/commands';
import { loadEvents } from 'loaders/events';
import { loadModals } from 'loaders/modals';
import { loadSelections } from 'loaders/selection';

import { initDatabase } from 'db/init';

import { keys } from 'constants/keys';
import { listenToErrors } from 'utils/error';
import { initTranslation } from 'utils/language';

export class DiscordClient extends Client {
  // Collections for loading and running commands, buttons and modals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public commands = new Collection<string, Command<any>>(); // Collection<commandName, commandData>
  public buttons = new Collection<string, Button>(); // Collection<customId, buttonData>
  public modals = new Collection<string, Modal>(); // Collection<customId, modalData>
  public selections = new Collection<string, Selection>(); // Collection<customId, selectionData>

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
    ticket: Colors.LuminousVividPink,
    level: Colors.Blue,
    reactionRoles: Colors.DarkGreen,
    general: Colors.Blurple,
    giveaway: Colors.Yellow,
    developer: Colors.Blurple,
    starboard: Colors.Gold
  };

  // Custom emojis
  // These are fetched in src/events/client/ready.ts
  public customEmojis: {
    [key: string]: string;
  } = {};

  // Cluster used for sharding from discord-hybrid-sharding
  public cluster = new ClusterClient(this);

  constructor() {
    super({
      // Setting the bot shards using discord-hybrid-sharding
      shards: getInfo().SHARD_LIST,
      shardCount: getInfo().TOTAL_SHARDS,

      // Throw errors on rate limit instead of sending request after rate limit has ended
      // We want to handle rate limits immediately instead of sending a request 10 minutes later
      rest: {
        // rejectOnRateLimit: async () => true
        // Turned off for now, as it's causing issues with reaction roles
      },

      // Setting the bots presence
      presence: {
        activities: keys.DISCORD_BOT_STATUS !== 'optional' ? [{ name: keys.DISCORD_BOT_STATUS, type: ActivityType.Custom }] : [],
        status: PresenceUpdateStatus.Online
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
        Partials.User
      ],

      // Intents are a way to specify which events your bot should receive from the Discord gateway
      intents: [
        // !! Needed for guilds, channels, roles and messages !!
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages, // !! Needed for phone and other things to work in DMs !!

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
        GatewayIntentBits.GuildPresences
      ]
    });

    // Loading everything and then logging in
    Promise.allSettled([
      loadEvents(this),
      loadCommands(this),
      loadButtons(this),
      loadModals(this),
      loadSelections(this),
      initTranslation(),
      initDatabase(this),
      listenToErrors(this)
    ]).then(() => {
      this.login(keys.DISCORD_BOT_TOKEN);
    });
  }
}
