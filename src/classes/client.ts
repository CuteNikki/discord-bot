import { Client, Collection, GatewayIntentBits } from 'discord.js';

import type { Command } from 'classes/command';
import { loadCommands, registerCommands } from 'loaders/commands';
import { loadEvents } from 'loaders/events';

export class DiscordClient extends Client {
  commands = new Collection<string, Command>(); // Collection<commandName, commandData>
  cooldowns = new Collection<string, Collection<string, number>>(); // Collection<commandName, Collection<userId, timestamp>>

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds, // !! Needed for guilds, channels and roles !!
        GatewayIntentBits.GuildModeration, // !! Needed to keep track of bans !!
        // (If a user gets banned and then unbanned they will still show up as banned in the cache without this intent)

        // privileged intents:
        GatewayIntentBits.GuildMembers, // !! Needed for welcome messages !!
        // GatewayIntentBits.GuildPresences // Not needed for anything
        // GatewayIntentBits.MessageContent // Not needed as we are not reading messages and only replying to interactions
      ],
    });

    // Load commands, events and register commands
    this.load();
    // Login with token
    this.login(process.env.DISCORD_BOT_TOKEN);
  }

  async load() {
    await loadEvents(this);
    await loadCommands(this);
    await registerCommands(this);
  }
}
