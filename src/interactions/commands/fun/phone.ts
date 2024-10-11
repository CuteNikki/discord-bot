import { ApplicationIntegrationType, InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { Command } from 'classes/command';

import { handlePhoneConnection, handlePhoneDisconnect } from 'utils/phone';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Fun,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('phone')
    .setDescription('Start a phone call with a random person')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .addSubcommand((subcommand) => subcommand.setName('connect').setDescription('Connects you to another random caller'))
    .addSubcommand((subcommand) => subcommand.setName('hangup').setDescription('Disconnects you from the call')),
  async execute({ client, interaction }) {
    switch (interaction.options.getSubcommand()) {
      case 'connect':
        {
          handlePhoneConnection({ client, interaction });
        }
        break;
      case 'hangup':
        {
          handlePhoneDisconnect({ client, interaction });
        }
        break;
    }
  }
});
