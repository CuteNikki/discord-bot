import {
  ApplicationCommandType,
  AutocompleteInteraction,
  BaseInteraction,
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  UserContextMenuCommandInteraction,
  type PermissionsString,
  type SlashCommandOptionsOnlyBuilder,
  type SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

/** Resolves the appropriate interaction type based on the provided application command type. */
type ResolveInteraction<T extends ApplicationCommandType> = T extends ApplicationCommandType.ChatInput
  ? ChatInputCommandInteraction
  : T extends ApplicationCommandType.Message
    ? MessageContextMenuCommandInteraction
    : T extends ApplicationCommandType.User
      ? UserContextMenuCommandInteraction
      : BaseInteraction;

/**
 * Represents a command with specified options.
 *
 * @template T - The type of the application command, defaults to `ApplicationCommandType.ChatInput`.
 */
export class Command<T extends ApplicationCommandType = ApplicationCommandType.ChatInput> {
  /**
   * Creates an instance of the command with the specified options.
   *
   * @param options - The options for the command.
   * @param options.botPermissions - The permissions required by the bot to execute this command.
   * @param options.isDevelopment - Indicates if the command is in development mode.
   * @param options.cooldown - The cooldown period in milliseconds for the command.
   * @param options.builder - The data for the command. This can be one of several builder types depending on the command type.
   * @param options.autocomplete - The function to execute when the command is in autocomplete mode.
   * @param options.execute - The function to execute when the command is called.
   */
  constructor(
    public options: {
      /** The permissions required by the bot to execute this command. */
      botPermissions?: PermissionsString[];
      /** Indicates if the command is in development mode. */
      isDevelopment?: boolean;
      /** The cooldown period in milliseconds for this command. */
      cooldown?: number;
      /** The data for the command. */
      builder: T extends ApplicationCommandType.ChatInput
        ?
            | SlashCommandBuilder
            | SlashCommandOptionsOnlyBuilder
            | SlashCommandSubcommandBuilder
            | SlashCommandSubcommandGroupBuilder
            | SlashCommandSubcommandsOnlyBuilder
        : ContextMenuCommandBuilder;
      /** The function to execute when the command is in autocomplete mode. */
      autocomplete?: (interaction: AutocompleteInteraction) => unknown;
      /** The function to execute when the command is called. */
      execute: (interaction: ResolveInteraction<T>) => unknown;
    },
  ) {}
}
