import {
  ApplicationCommandType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
  type RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js';
import { DiscordClient } from './client';

export enum Contexts {
  Guild,
  BotDM,
  PrivateChannel,
}

export enum IntegrationTypes {
  GuildInstall,
  UserInstall,
}

export enum ModuleType {
  Developer,
  Moderation,
  Level,
  General,
  Utilities,
  Config,
  Music,
  Games,
  Fun,
}

type InteractionType<CommandType extends ApplicationCommandType> = CommandType extends ApplicationCommandType.ChatInput
  ? ChatInputCommandInteraction
  : CommandType extends ApplicationCommandType.Message
  ? MessageContextMenuCommandInteraction
  : CommandType extends ApplicationCommandType.User
  ? UserContextMenuCommandInteraction
  : never;

export class Command<CommandType extends ApplicationCommandType = any> {
  constructor(
    public options: {
      data: RESTPostAPIApplicationCommandsJSONBody & {
        type: CommandType;
        contexts?: Contexts[];
        integration_types?: IntegrationTypes[];
      };
      module: ModuleType;
      cooldown?: number; // Cooldown between command executes per user (in milliseconds)
      isDeveloperOnly?: boolean; // If true, can only be used by developers
      autocomplete?({ client, interaction }: { client: DiscordClient; interaction: AutocompleteInteraction }): any;
      execute({ client, interaction }: { client: DiscordClient; interaction: InteractionType<CommandType> }): any;
    }
  ) {}
}
