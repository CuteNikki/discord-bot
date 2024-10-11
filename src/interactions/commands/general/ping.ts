import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder
} from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.General,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Shows you roundtrip and websocket heartbeat latency')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('Shows the message to everyone when false').setRequired(false)),
  async execute({ interaction, client, lng }) {
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;

    const sent = await interaction.reply({
      content: t('ping.pinging', { lng }),
      fetchReply: true,
      ephemeral
    });

    const websocketHeartbeat = interaction.guild?.shard.ping ?? client.ws.ping;

    await interaction.editReply({
      content: '',
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.general)
          .setTitle(t('ping.title', { lng }))
          .addFields(
            {
              name: t('ping.websocket', { lng }),
              value: `${websocketHeartbeat}ms`
            },
            {
              name: t('ping.roundtrip', { lng }),
              value: `${sent.createdTimestamp - interaction.createdTimestamp}ms`
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
