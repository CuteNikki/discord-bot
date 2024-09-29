import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

export default new Button({
  customId: 'button-ping-update',
  isAuthorOnly: false,
  isCustomIdIncluded: false,
  permissions: [],
  botPermissions: ['SendMessages'],
  async execute({ interaction, client, lng }) {
    const sent = await interaction.update({
      content: t('ping.pinging', { lng }),
      fetchReply: true,
    });

    const websocketHeartbeat = interaction.guild?.shard.ping ?? client.ws.ping;

    await interaction.editReply({
      content: '',
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle(t('ping.title', { lng }))
          .addFields(
            {
              name: t('ping.websocket', { lng }),
              value: `${websocketHeartbeat}ms`,
            },
            {
              name: t('ping.roundtrip', { lng }),
              value: `${sent.editedTimestamp! - interaction.createdTimestamp}ms`,
            },
            {
              name: t('ping.last_updated', { lng }),
              value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
            },
          ),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder().setCustomId('button-ping-update').setLabel(t('ping.update', { lng })).setStyle(ButtonStyle.Primary),
        ),
      ],
    });
  },
});
