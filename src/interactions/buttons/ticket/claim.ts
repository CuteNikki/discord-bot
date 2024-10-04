import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getGuildSettings } from 'db/guild';
import { claimTicket, findTicket } from 'db/ticket';

export default new Button({
  customId: 'button-tickets-claim',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['SendMessages'],
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    const { user, guildId, channelId, customId, member } = interaction;

    const currentConfig = await getGuildSettings(guildId);

    const guildLng = currentConfig.language;

    const system = currentConfig.ticket.systems.find((system) => system._id.toString() === customId.split('_')[1]);

    if (!system) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid-system', { lng }))],
        ephemeral: true
      });
      return;
    }

    const ticket = await findTicket(channelId);

    if (!ticket) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid-ticket', { lng }))],
        ephemeral: true
      });
      return;
    }

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      if (!member.roles.cache.has(system.staffRoleId)) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.staff-only', { lng }))],
          ephemeral: true
        });
        return;
      }
    }

    if (ticket.claimedBy) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.already-claimed', { lng, claimedBy: `<@${ticket.claimedBy}>` }))],
        ephemeral: true
      });
      return;
    }

    await claimTicket(channelId, user.id);

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(client.colors.ticket).setDescription(t('ticket.claimed', { lng: guildLng, claimedBy: user.toString() }))]
    });
  }
});
