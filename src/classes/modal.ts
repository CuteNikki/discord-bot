import type { ModalSubmitInteraction, PermissionsString } from 'discord.js';

/**
 * Represents a button with specified options.
 */
export class Modal {
  /**
   * Creates an instance of the button with the specified options.
   *
   * @param options - The options for the button.
   * @param options.botPermissions - The permissions required by the bot.
   * @param options.isDevelopment - Indicates if the button is in development mode.
   * @param options.cooldown - The cooldown period in milliseconds for this button.
   * @param options.customId - The custom ID for the button.
   * @param options.includeCustomId - If true, the custom ID can be included; if false, it must be an exact match.
   * @param options.execute - The function to execute when the button is pressed.
   */
  constructor(
    public options: {
      /** The permissions required by the user. */
      userPermissions?: PermissionsString[];
      /** The permissions required by the bot. */
      botPermissions?: PermissionsString[];
      /** Indicates if the button is in development mode. */
      isDevelopment?: boolean;
      /** The cooldown period in milliseconds for this button. */
      cooldown?: number;
      /** The custom ID for the button. */
      customId: string;
      /** If true, the custom ID can be included; if false, it must be an exact match. */
      includeCustomId?: boolean;
      /** The function to execute when the button is pressed. */
      execute: (interaction: ModalSubmitInteraction) => unknown;
    },
  ) {}
}
