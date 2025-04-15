import type { PermissionsString, SelectMenuInteraction } from 'discord.js';

export class SelectMenu {
  /**
   * Creates an instance of the select menu with the specified options.
   * 
   * @param options - The options for the select menu.
   * @param options.userPermissions - The permissions required by the user.
   * @param options.botPermissions - The permissions required by the bot.
   * @param options.isDevelopment - Indicates if the select menu is in development mode.
   * @param options.cooldown - The cooldown period in milliseconds for this select menu.
   * @param options.customId - The custom ID for the select menu.
   * @param options.includeCustomId - If true, the custom ID can be included; if false, it must be an exact match.
   * @param options.execute - The function to execute when the select menu is used. 
   */
  constructor(
    public options: {
      /** The permissions required by the user. */
      userPermissions?: PermissionsString[];
      /** The permissions required by the bot. */
      botPermissions?: PermissionsString[];
      /** Indicates if the select menu is in development mode. */
      isDevelopment?: boolean;
      /** The cooldown period in milliseconds for this select menu. */
      cooldown?: number;
      /** The custom ID for the select menu. */
      customId: string;
      /** If true, the custom ID can be included; if false, it must be an exact match. */
      includeCustomId?: boolean;
      /** The function to execute when the select menu is used. */
      execute: (interaction: SelectMenuInteraction) => unknown;
    },
  ) {}
}
