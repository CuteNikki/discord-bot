import { t } from 'i18next';

import { Button } from 'classes/button';

import { getGuildSettings } from 'db/guild';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { ticketModel } from 'models/ticket';

export default new Button({
  customId: 'button-tickets-claim',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['SendMessages'],
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { user, guildId, channelId, customId, member } = interaction;

    const currentConfig = await getGuildSettings(guildId);
    const lng = currentConfig.language;

    const system = currentConfig.ticket.systems.find((system) => system._id.toString() === customId.split('_')[1]);

    if (!system) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid_system', { lng }))],
        ephemeral: true,
      });
      return;
    }

    const ticket = await ticketModel.findOne({ channelId });

    if (!ticket) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid_ticket', { lng }))],
        ephemeral: true,
      });
      return;
    }

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      if (!member.roles.cache.has(system.staffRoleId)) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.staff_only', { lng }))],
          ephemeral: true,
        });
        return;
      }
    }

    if (ticket.claimedBy) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.already_claimed', { lng, claimed_by: `<@${ticket.claimedBy}>` }))],
        ephemeral: true,
      });
      return;
    }

    await ticketModel.findOneAndUpdate({ channelId }, { claimedBy: user.id });

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(client.colors.ticket).setDescription(t('ticket.claimed', { lng, claimed_by: user.toString() }))],
    });
  },
});
