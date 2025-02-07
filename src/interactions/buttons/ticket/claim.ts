import { EmbedBuilder, PermissionFlagsBits, userMention } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getGuildLanguage } from 'db/language';
import { claimTicket, findTicket, getTicketGroup } from 'db/ticket';

import { ModuleType } from 'types/interactions';

export default new Button({
  module: ModuleType.Ticket,
  customId: 'button-tickets-claim',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['SendMessages'],
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    const { user, guildId, channelId, customId, member } = interaction;

    const guildLng = await getGuildLanguage(guildId);

    const group = await getTicketGroup(customId.split('_')[1]);

    if (!group) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid-group', { lng }))],
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    const ticket = await findTicket(channelId);

    if (!ticket) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid-ticket', { lng }))],
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      if (!member.roles.cache.has(group.staffRoleId)) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.staff-only', { lng }))],
          flags: [MessageFlags.Ephemeral]
        });
        return;
      }
    }

    if (ticket.claimedBy) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.already-claimed', { lng, claimedBy: userMention(ticket.claimedBy) }))
        ],
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    await claimTicket(channelId, user.id);

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(client.colors.ticket).setDescription(t('ticket.claimed', { lng: guildLng, claimedBy: user.toString() }))]
    });
  }
});
