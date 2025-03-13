import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { disableEconomy, enableEconomy, getEconomy } from 'db/economy';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Config,
  data: new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setName('economy')
    .setDescription('Configure the economy system')
    .addSubcommand((cmd) => cmd.setName('enable').setDescription('Enable the economy system'))
    .addSubcommand((cmd) => cmd.setName('disable').setDescription('Disable the economy system'))
    .addSubcommand((cmd) => cmd.setName('info').setDescription('Get information about the economy system')),
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) {
      return;
    }

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const settings = (await getEconomy(interaction.guildId)) ?? { enabled: false };

    switch (interaction.options.getSubcommand()) {
      case 'enable':
        {
          if (settings.enabled) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('economy.state.already-enabled', { lng }))]
            });
            return;
          }

          await enableEconomy(interaction.guildId);

          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.economy).setDescription(t('economy.state.enabled', { lng }))]
          });
        }
        break;
      case 'disable':
        {
          if (!settings.enabled) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('economy.state.already-disabled', { lng }))]
            });
            return;
          }

          await disableEconomy(interaction.guildId);

          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.economy).setDescription(t('economy.state.disabled', { lng }))]
          });
        }
        break;
      case 'info':
        {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.economy)
                .setTitle(t('economy.title', { lng }))
                .addFields({ name: t('economy.state.title', { lng }), value: settings.enabled ? t('enabled', { lng }) : t('disabled', { lng }) })
            ]
          });
        }
        break;
    }
  }
});
