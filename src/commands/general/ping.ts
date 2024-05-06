import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes } from 'classes/command';

export default new Command({
  data: {
    name: 'ping',
    description: 'Replies with Pong!',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD, Contexts.BOT_DM, Contexts.PRIVATE_CHANNEL],
    integration_types: [IntegrationTypes.GUILD_INSTALL, IntegrationTypes.USER_INSTALL],
  },
  async execute({ interaction, client }) {
    const lng = await client.getLanguage(interaction.user.id);

    const sent = await interaction.reply({ content: i18next.t('ping.pinging', { lng }), fetchReply: true });

    await interaction.editReply({
      content: '',
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle(i18next.t('ping.title', { lng }))
          .addFields(
            { name: i18next.t('ping.websocket', { lng }), value: `${client.ws.ping}ms` },
            { name: i18next.t('ping.roundtrip', { lng }), value: `${sent.createdTimestamp - interaction.createdTimestamp}ms` }
          ),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder().setCustomId('button_ping_update').setLabel(i18next.t('ping.update', { lng })).setStyle(ButtonStyle.Primary)
        ),
      ],
    });
  },
});
