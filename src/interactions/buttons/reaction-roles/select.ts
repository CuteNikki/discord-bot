import { EmbedBuilder, PermissionFlagsBits, roleMention } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getReactionRoles } from 'db/reaction-roles';

import { logger } from 'utils/logger';

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

    if (
      group.requiredRoles?.length &&
      !interaction.member.roles.cache.hasAll(...group.requiredRoles) &&
      !interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)
    ) {
      const roles = group.requiredRoles.map((r) => roleMention(r));

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.colors.error)
            .setDescription(t('reaction-roles.select.required-roles', { lng, count: roles.length, roles: roles.join(', ') }))
        ]
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
      const success = await interaction.member.roles.remove(role).catch((err) => logger.debug({ err }, 'ReactionRoles | Select: Could not remove role'));

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
      if (group.singleMode && interaction.member.roles.cache.hasAny(...group.reactions.map((r) => r.roleId))) {
        const removed = await interaction.member.roles
          .remove(interaction.member.roles.cache.filter((r) => group.reactions.map((rea) => rea.roleId).includes(r.id))!)
          .catch((err) => logger.debug({ err }, 'ReactionRoles | Select: Could not remove role'));

        if (!removed) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reaction-roles.select.single-mode', { lng }))]
          });
          return;
        }
      }

      const success = await interaction.member.roles.add(role).catch((err) => logger.debug({ err }, 'ReactionRoles | Select: Could not add role'));

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
