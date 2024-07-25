import { ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';
import { ticketModel } from 'models/ticket';

export default new Button({
  customId: 'tickets-close',
  isCustomIdIncluded: true,
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild() || !interaction.channelId) return;
    const { user, guildId, channelId, customId } = interaction;

    const currentConfig = await client.getGuildSettings(guildId);
    const lng = currentConfig.language;

    const system = currentConfig.ticket.systems.find((system) => system._id.toString() === customId.split('_')[1]);
    if (!system) return interaction.reply({ content: t('tickets.invalid_system', { lng }), ephemeral: true });

    if (!interaction.member.roles.cache.has(system.staffRoleId)) return interaction.reply({ content: t('tickets.staff_only', { lng }), ephemeral: true });

    const ticket = await ticketModel.findOne({ channelId });
    if (!ticket) return interaction.reply({ content: t('tickets.invalid_ticket', { lng }) });

    if (!ticket.claimedBy) return interaction.reply({ content: t('tickets.not_claimed', { lng }), ephemeral: true });

    if (ticket.closed)
      return interaction.reply({
        content: t('tickets.already_closed', { lng }),
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`tickets-save_${system._id.toString()}`)
              .setLabel(t('tickets.save', { lng }))
              .setEmoji('💾')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`tickets-delete_${system._id.toString()}`)
              .setLabel(t('tickets.delete', { lng }))
              .setEmoji('🗑️')
              .setStyle(ButtonStyle.Danger)
          ),
        ],
      });

    try {
      const channel = interaction.channel as TextChannel;
      for (const userId of ticket.users) {
        await channel.permissionOverwrites.edit(userId, { ViewChannel: false });
      }
      await ticketModel.findOneAndUpdate({ channelId }, { closed: true });

      interaction.reply({
        content: t('tickets.closed', { lng, closed_by: `${user.toString()}` }),
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`tickets-save_${system._id.toString()}`)
              .setLabel(t('tickets.save', { lng }))
              .setEmoji('🗂️')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`tickets-delete_${system._id.toString()}`)
              .setLabel(t('tickets.delete', { lng }))
              .setEmoji('✖️')
              .setStyle(ButtonStyle.Danger)
          ),
        ],
      });
    } catch (error) {
      interaction.reply({ content: t('tickets.error', { lng }) });
    }
  },
});
