import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  type MessageContextMenuCommandInteraction,
  type PermissionsString,
  type SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
  type SlashCommandSubcommandBuilder,
  type SlashCommandSubcommandGroupBuilder,
  type SlashCommandSubcommandsOnlyBuilder,
  type UserContextMenuCommandInteraction,
} from 'discord.js';

import type { DiscordClient } from 'classes/client';

export enum ModuleType {
  Developer,
  Moderation,
  Level,
  General,
  Utilities,
  Config,
  Fun,
}

type InteractionType<CommandType extends ApplicationCommandType> = CommandType extends ApplicationCommandType.ChatInput
  ? ChatInputCommandInteraction
  : CommandType extends ApplicationCommandType.Message
    ? MessageContextMenuCommandInteraction
    : CommandType extends ApplicationCommandType.User
      ? UserContextMenuCommandInteraction
      : never;

export class Command<CommandType extends ApplicationCommandType = ApplicationCommandType.ChatInput> {
  constructor(
    public options: {
      data: CommandType extends ApplicationCommandType.ChatInput
        ?
            | SlashCommandBuilder
            | SlashCommandOptionsOnlyBuilder
            | SlashCommandSubcommandBuilder
            | SlashCommandSubcommandGroupBuilder
            | SlashCommandSubcommandsOnlyBuilder
        : ContextMenuCommandBuilder;
      module: ModuleType;
      cooldown?: number; // Cooldown between command executes per user (in milliseconds)
      isDeveloperOnly?: boolean; // If true, can only be used by developers
      botPermissions?: PermissionsString[]; // Array of permissions the bot requires
      autocomplete?({ client, interaction }: { client: DiscordClient; interaction: AutocompleteInteraction; lng: string }): any;
      execute({ client, interaction, lng }: { client: DiscordClient; interaction: InteractionType<CommandType>; lng: string }): any;
    },
  ) {}
}
