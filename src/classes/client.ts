import { ApplicationEmoji, Client, Collection } from 'discord.js';

import type { Button } from 'classes/button';
import type { Command } from 'classes/command';
import type { Modal } from 'classes/modal';

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

  /**
   * Buttons collection.
   * Collection<customId, Button>
   */
  buttons = new Collection<string, Button>();

  /**
   * Modals collection.
   * Collection<customId, Modal>
   */
  modals = new Collection<string, Modal>();

  /**
   * Custom emojis
   * This is a map of emoji names to their string representation.
   * For example: { "emojiName": "<:emojiName:emojiId>" }
   * This is used to store custom emojis that are fetched from the Discord API.
   * The emojis are fetched in src/events/client/ready.ts on client ready.
   */
  customEmojis: {
    [key: string]: ApplicationEmoji;
  } = {};
}
