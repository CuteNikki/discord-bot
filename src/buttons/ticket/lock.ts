import { ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { ticketModel } from 'models/ticket';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-tickets-lock',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['ManageChannels', 'SendMessages'],
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { user, guildId, channelId, customId } = interaction;

    const currentConfig = await client.getGuildSettings(guildId);
    const lng = currentConfig.language;

    const system = currentConfig.ticket.systems.find((system) => system._id.toString() === customId.split('_')[1]);
    if (!system)
      return interaction.reply({
        content: t('tickets.invalid_system', { lng }),
        ephemeral: true,
      });

    if (!interaction.member.roles.cache.has(system.staffRoleId))
      return interaction.reply({
        content: t('tickets.staff_only', { lng }),
        ephemeral: true,
      });

    const ticket = await ticketModel.findOne({ channelId });
    if (!ticket)
      return interaction.reply({
        content: t('tickets.invalid_ticket', { lng }),
        ephemeral: true,
      });

    if (!ticket.claimedBy)
      return interaction.reply({
        content: t('tickets.not_claimed', { lng }),
        ephemeral: true,
      });

    if (ticket.closed)
      return interaction.reply({
        content: t('tickets.already_closed', { lng }),
        ephemeral: true,
      });
    if (ticket.locked)
      return interaction.reply({
        content: t('tickets.already_locked', { lng }),
        ephemeral: true,
      });

    const channel = interaction.channel as TextChannel;
    for (const userId of ticket.users) {
      const overwrite = await channel.permissionOverwrites
        .edit(userId, { SendMessages: false })
        .catch((err) => logger.debug({ err, userId }, 'Could not edit channel permissions'));
      if (!overwrite) {
        interaction.reply({ content: t('tickets.error', { lng }) });
        break;
      }
    }
    await ticketModel.findOneAndUpdate({ channelId }, { locked: true });

    interaction.reply({
      content: t('tickets.locked', { lng, locked_by: `${user.toString()}` }),
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`button-tickets-unlock_${system._id.toString()}`)
            .setLabel(t('tickets.unlock', { lng }))
            .setEmoji('🔓')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`button-tickets-close_${system._id.toString()}`)
            .setLabel(t('tickets.close', { lng }))
            .setEmoji('🛑')
            .setStyle(ButtonStyle.Danger),
        ),
      ],
    });
  },
});
