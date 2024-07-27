import { t } from 'i18next';

import { Button } from 'classes/button';
import { ticketModel } from 'models/ticket';

export default new Button({
  customId: 'button-tickets-claim',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['SendMessages'],
  async execute({ client, interaction }) {
    if (!interaction.inCachedGuild() || !interaction.channelId) return;
    const { user, guildId, channelId, customId } = interaction;

    const currentConfig = await client.getGuildSettings(guildId);
    const lng = currentConfig.language;

    const system = currentConfig.ticket.systems.find((system) => system._id.toString() === customId.split('_')[1]);
    if (!system) return interaction.reply({ content: t('tickets.invalid_system', { lng }), ephemeral: true });

    if (!interaction.member.roles.cache.has(system.staffRoleId)) return interaction.reply({ content: t('tickets.staff_only', { lng }), ephemeral: true });

    const ticket = await ticketModel.findOne({ channelId });
    if (!ticket) return interaction.reply({ content: t('tickets.invalid_ticket', { lng }) });

    if (ticket.claimedBy) return interaction.reply({ content: t('tickets.already_claimed', { lng, claimed_by: `<@${ticket.claimedBy}>` }), ephemeral: true });
    await ticketModel.findOneAndUpdate({ channelId }, { claimedBy: user.id });

    interaction.reply({ content: t('tickets.claimed', { lng, claimed_by: `${user.toString()}` }) });
  },
});
