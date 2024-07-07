import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

export default new Command({
  module: ModuleType.General,
  data: {
    name: 'uptime',
    description: 'Shows how long the bot has been running for',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.Guild, Contexts.BotDM, Contexts.PrivateChannel],
    integration_types: [IntegrationTypes.GuildInstall, IntegrationTypes.UserInstall],
    options: [
      {
        name: 'ephemeral',
        description: 'When set to false will show the message to everyone',
        type: ApplicationCommandOptionType.Boolean,
      },
    ],
  },
  async execute({ interaction, client }) {
    const lng = await client.getUserLanguage(interaction.user.id);
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle(i18next.t('uptime.title', { lng }))
          .setDescription(i18next.t('uptime.description', { lng, uptime: `<t:${Math.floor(interaction.client.readyTimestamp / 1000)}:R>` })),
      ],
    });
  },
});
