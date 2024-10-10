import { EmbedBuilder, userMention, type TextChannel } from 'discord.js';
import { t } from 'i18next';

import { Selection } from 'classes/selection';

import { getGuildLanguage } from 'db/language';
import { addUserToTicket, findTicket, getTicketGroup, removeUserFromTicket } from 'db/ticket';

export default new Selection({
  customId: 'selection-tickets-user',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['ManageChannels', 'SendMessages'],
  async execute({ interaction, lng }) {
    if (!interaction.inCachedGuild() || !interaction.isUserSelectMenu()) return;

    const {
      user,
      values: [targetId],
      guildId,
      customId,
      member
    } = interaction;

    const targetMember = interaction.guild.members.cache.get(targetId);

    const guildLng = await getGuildLanguage(guildId);

    const group = await getTicketGroup(customId.split('_')[1]);

    if (!group) {
      await interaction.reply({
        content: t('ticket.invalid-group', { lng }),
        ephemeral: true
      });
      return;
    }

    const ticket = await findTicket(interaction.channel!.id);

    if (!ticket) {
      await interaction.reply({
        content: t('ticket.invalid-ticket', { lng }),
        ephemeral: true
      });
      return;
    }

    if (ticket.closed || ticket.locked) {
      await interaction.reply({
        content: t('ticket.user-unavailable', { lng }),
        ephemeral: true
      });
      return;
    }

    if (user.id !== ticket.createdBy || !member.roles.cache.has(group.staffRoleId)) {
      await interaction.reply({ content: t('ticket.user-permissions', { lng }) });
      return;
    }

    if (!targetMember) {
      await interaction.reply({
        content: t('ticket.user-invalid', { lng }),
        ephemeral: true
      });
      return;
    }

    if (targetMember.roles.cache.has(group.staffRoleId)) {
      await interaction.reply({
        content: t('ticket.user-staff', { lng }),
        ephemeral: true
      });
      return;
    }

    if (targetId === ticket.createdBy) {
      await interaction.reply({
        content: t('ticket.user-creator', { lng }),
        ephemeral: true
      });
      return;
    }

    if (ticket.users.includes(targetId)) {
      const channel = interaction.channel as TextChannel;

      await channel.permissionOverwrites.edit(targetId, {
        ViewChannel: false,
        SendMessages: false,
        EmbedLinks: false,
        AttachFiles: false
      });

      await removeUserFromTicket(channel.id, targetId);

      await interaction.reply({
        embeds: [
          new EmbedBuilder().setDescription(
            t('ticket.user-removed', {
              lng: guildLng,
              targetUser: userMention(targetId),
              removedBy: user.toString()
            })
          )
        ]
      });
    } else {
      const channel = interaction.channel as TextChannel;

      await channel.permissionOverwrites.edit(targetId, {
        ViewChannel: true,
        SendMessages: true,
        EmbedLinks: true,
        AttachFiles: true
      });

      await addUserToTicket(channel.id, targetId);

      await interaction.reply({
        embeds: [
          new EmbedBuilder().setDescription(
            t('ticket.user-added', {
              lng: guildLng,
              targetUser: userMention(targetId),
              addedBy: user.toString()
            })
          )
        ]
      });
    }
  }
});
