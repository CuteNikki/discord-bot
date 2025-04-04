import { ApplicationIntegrationType, InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { Command } from 'classes/command';
import { MessageBuilder } from 'classes/message-builder';

export default new Command({
  builder: new SlashCommandBuilder()
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .setName('builder')
    .setDescription('Create a custom message'),
  async execute(interaction) {
    await interaction.deferReply();

    new MessageBuilder({
      interaction,
    });
  },
});
