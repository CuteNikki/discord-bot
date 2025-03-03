import type { Command } from 'classes/command';
import { Client, Collection } from 'discord.js';

/**
 * ExtendedClient class that extends the Discord.js Client class.
 * This class includes a collection of commands.
 *
 * @extends {Client}
 */
export class ExtendedClient extends Client {
  /**
   * Collection of commands.
   * Collection<commandName, Command>
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commands = new Collection<string, Command<any>>();
  /**
   * Cooldowns collection.
   * Collection<commandName, Collection<userId, removeTimestamp>>
   */
  cooldowns = new Collection<string, Collection<string, number>>();
}
