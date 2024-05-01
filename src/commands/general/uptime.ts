import { ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

import { Command, Context, IntegrationTypes } from 'classes/command';

export default new Command({
  data: {
    name: 'uptime',
    description: 'Shows how long the bot has been running for',
    type: ApplicationCommandType.ChatInput,
    contexts: [Context.GUILD, Context.BOT_DM, Context.PRIVATE_CHANNEL],
    integration_types: [IntegrationTypes.GUILD_INSTALL, IntegrationTypes.USER_INSTALL],
  },
  async execute({ interaction, client }) {
    const lng = client.getLanguage(interaction.user.id);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle(i18next.t('uptime.title', { lng }))
          .setDescription(i18next.t('uptime.description', { lng, uptime: `<t:${Math.floor(interaction.client.readyTimestamp / 1000)}:R>` })),
      ],
      ephemeral: true,
    });
  },
});
