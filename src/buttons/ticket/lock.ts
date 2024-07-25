import { ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';
import { ticketModel } from 'models/ticket';

export default new Button({
  customId: 'tickets-lock',
  isCustomIdIncluded: true,
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { user, guildId, channelId, customId } = interaction;

    const currentConfig = await client.getGuildSettings(guildId);
    const lng = currentConfig.language;

    const system = currentConfig.ticket.systems.find((system) => system._id.toString() === customId.split('_')[1]);
    if (!system) return interaction.reply({ content: t('tickets.invalid_system', { lng }), ephemeral: true });

    if (!interaction.member.roles.cache.has(system.staffRoleId)) return interaction.reply({ content: t('tickets.staff_only', { lng }), ephemeral: true });

    const ticket = await ticketModel.findOne({ channelId });
    if (!ticket) return interaction.reply({ content: t('tickets.invalid_ticket', { lng }), ephemeral: true });

    if (!ticket.claimedBy) return interaction.reply({ content: t('tickets.not_claimed', { lng }), ephemeral: true });

    if (ticket.locked) return interaction.reply({ content: t('tickets.already_locked', { lng }), ephemeral: true });

    try {
      const channel = interaction.channel as TextChannel;
      for (const userId of ticket.users) {
        await channel.permissionOverwrites.edit(userId, { SendMessages: false });
      }
      await ticketModel.findOneAndUpdate({ channelId }, { locked: true });

      interaction.reply({
        content: t('tickets.locked', { lng, locked_by: `${user.toString()}` }),
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`tickets-unlock_${system._id.toString()}`)
              .setLabel(t('tickets.unlock', { lng }))
              .setEmoji('🔓')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`tickets-close_${system._id.toString()}`)
              .setLabel(t('tickets.close', { lng }))
              .setEmoji('🛑')
              .setStyle(ButtonStyle.Danger)
          ),
        ],
      });
    } catch (error) {
      interaction.reply({ content: t('tickets.error', { lng }) });
    }
  },
});
