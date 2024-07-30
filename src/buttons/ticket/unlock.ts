import { ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { ticketModel } from 'models/ticket';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-tickets-unlock',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['ManageChannels', 'SendMessages'],
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { guildId, customId } = interaction;

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

    const ticket = await ticketModel.findOne({
      channelId: interaction.channel?.id,
    });
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
    if (!ticket.locked)
      return interaction.reply({
        content: t('tickets.already_unlocked', { lng }),
        ephemeral: true,
      });

    const channel = interaction.channel as TextChannel;
    for (const userId of ticket.users) {
      const overwrite = await channel.permissionOverwrites
        .edit(userId, { SendMessages: true })
        .catch((err) => logger.debug({ err, userId }, 'Could not edit channel permissions'));
      if (!overwrite) {
        interaction.reply({ content: t('tickets.error', { lng }) });
        break;
      }
    }

    await ticketModel.findOneAndUpdate({ channelId: interaction.channel?.id }, { locked: false });
    await interaction.reply({
      content: t('tickets.unlocked', {
        lng,
        unlocked_by: `${interaction.user}`,
      }),
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`button-tickets-lock_${system._id.toString()}`)
            .setLabel(t('tickets.lock', { lng }))
            .setEmoji('🔐')
            .setStyle(ButtonStyle.Primary),
        ),
      ],
    });
  },
});
