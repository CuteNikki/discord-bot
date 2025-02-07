import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder, time, TimestampStyles } from 'discord.js';

import { Command } from 'classes/command';

import { t } from 'i18next';
import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Utilities,
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Get information about a role')
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .addRoleOption((option) => option.setName('role').setDescription('Role to get the information about').setRequired(true))
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to false will show the message to everyone').setRequired(false)),
  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild()) {
      return;
    }

    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;

    await interaction.deferReply({ flags: ephemeral ? [MessageFlags.Ephemeral] : undefined });

    const role = interaction.options.getRole('role', true);

    const embed = new EmbedBuilder()
      .setTitle(t('roleinfo.title', { lng }))
      .setColor(client.colors.utilities)
      .addFields(
        { name: t('roleinfo.name', { lng }), value: role.name, inline: true },
        { name: t('roleinfo.id', { lng }), value: role.id, inline: true },
        { name: t('roleinfo.color', { lng }), value: role.hexColor, inline: true },
        { name: t('roleinfo.position', { lng }), value: role.position.toString(), inline: true },
        { name: t('roleinfo.managed', { lng }), value: role.managed ? t('yes', { lng }) : t('no', { lng }), inline: true },
        {
          name: t('roleinfo.created-at', { lng }),
          value: `${time(Math.floor(role.createdTimestamp / 1000), TimestampStyles.ShortDate)} | ${time(Math.floor(role.createdTimestamp / 1000), TimestampStyles.RelativeTime)}`,
          inline: true
        },
        { name: t('roleinfo.hoist', { lng }), value: role.hoist ? t('yes', { lng }) : t('no', { lng }), inline: true },
        { name: t('roleinfo.mentionable', { lng }), value: role.mentionable ? t('yes', { lng }) : t('no', { lng }), inline: true },
        { name: t('roleinfo.members', { lng }), value: role.members.size.toString(), inline: true },
        { name: t('roleinfo.permissions', { lng }), value: role.permissions.toArray().join(', '), inline: false }
      );

    interaction.editReply({ embeds: [embed] });
  }
});
