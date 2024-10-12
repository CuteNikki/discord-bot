import { EmbedBuilder } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getReactionRoles } from 'db/reaction-roles';

import { ModuleType } from 'types/interactions';

export default new Button({
  module: ModuleType.Config,
  customId: 'button-reaction-select',
  isCustomIdIncluded: true,
  botPermissions: ['ManageRoles'],
  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild()) {
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const reactionRoles = await getReactionRoles(interaction.guildId);

    if (!reactionRoles || !reactionRoles.enabled) return;

    const group = reactionRoles.groups.find((g) => g.messageId === interaction.message.id);

    if (!group) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.select.unknown-group', { lng }))]
      });
      return;
    }

    const reactionIndex = parseInt(interaction.customId.split('_')[1]);
    const reaction = group.reactions[reactionIndex];

    if (!reaction) {
      return;
    }

    const role = interaction.guild.roles.cache.get(reaction.roleId);

    if (!role) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.select.role-not-found', { lng }))]
      });
    }

    if (interaction.member.roles.cache.has(reaction.roleId)) {
      const success = await interaction.member.roles.remove(role).catch((err) => console.error(err));

      if (!success) {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.select.failed', { lng }))]
        });
        return;
      }

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.success).setDescription(t('reaction-roles.select.removed', { lng, role: role.toString() }))]
      });
    } else {
      const success = await interaction.member.roles.add(role).catch((err) => console.error(err));

      if (!success) {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.select.failed', { lng }))]
        });
        return;
      }

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.success).setDescription(t('reaction-roles.select.added', { lng, role: role.toString() }))]
      });
    }
  }
});
