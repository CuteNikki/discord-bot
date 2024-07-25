import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';
import { ticketModel } from 'models/ticket';

export default new Button({
  customId: 'tickets-delete',
  isCustomIdIncluded: true,
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { guildId, channelId, customId } = interaction;

    const currentConfig = await client.getGuildSettings(guildId);
    const lng = currentConfig.language;

    const system = currentConfig.ticket.systems.find((system) => system._id.toString() === customId.split('_')[1]);
    if (!system) return interaction.reply({ content: t('tickets.invalid_system', { lng }), ephemeral: true });

    if (!interaction.member.roles.cache.has(system.staffRoleId)) return interaction.reply({ content: t('tickets.staff_only', { lng }), ephemeral: true });

    const ticket = await ticketModel.findOne({ channelId });
    if (!ticket) return interaction.reply({ content: `${t('tickets.invalid_ticket', { lng })}` });

    interaction.reply({
      content: `${t('tickets.ticket_deleted', { lng, deleted_by: `${interaction.user}` })}\n${t('tickets.delete_time', { lng })}\n${t(
        'tickets.delete_reminder',
        { lng }
      )}`,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`tickets-save_${system._id.toString()}`)
            .setLabel(t('tickets.save', { lng }))
            .setEmoji('🗂️')
            .setStyle(ButtonStyle.Success)
        ),
      ],
    });

    setTimeout(async () => {
      try {
        await interaction.channel?.delete();
        await ticketModel.deleteOne({ _id: ticket._id });
      } catch (error) {
        interaction.editReply({ content: `${t('tickets.error', { lng })}\n${t('tickets.invalid_ticket', { lng })}` });
      }
    }, 5000);
  },
});
