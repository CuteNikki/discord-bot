import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, time, TimestampStyles } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { ModuleType } from 'types/interactions';

export default new Button({
  module: ModuleType.General,
  customId: 'button-ping-update',
  isAuthorOnly: false,
  isCustomIdIncluded: false,
  permissions: [],
  botPermissions: ['SendMessages'],
  async execute({ interaction, client, lng }) {
    const sent = await interaction.update({
      content: t('ping.pinging', { lng }),
      withResponse: true
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
              value: `${websocketHeartbeat}ms`
            },
            {
              name: t('ping.roundtrip', { lng }),
              value: `${sent.resource!.message!.editedTimestamp! - interaction.createdTimestamp}ms`
            },
            {
              name: t('ping.last-updated', { lng }),
              value: `${time(Math.floor(Date.now() / 1000), TimestampStyles.RelativeTime)}`
            }
          )
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder().setCustomId('button-ping-update').setLabel(t('ping.update', { lng })).setStyle(ButtonStyle.Primary)
        )
      ]
    });
  }
});
