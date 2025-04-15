import { InfractionType } from '@prisma/client';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, MessageFlags, time, TimestampStyles } from 'discord.js';

import type { ExtendedClient } from 'classes/client';
import { Modal } from 'classes/modal';

import { getInfractionsByUserIdAndGuildId } from 'database/infraction';

export default new Modal({
  customId: 'infractions-custom',
  includeCustomId: true,
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const targetUserId = interaction.customId.split('_')[1];
    const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);

    if (!targetUser) {
      await interaction.reply({
        content: 'User not found.',
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    const ITEMS_PER_PAGE = 3;
    const totalInfractions = await getInfractionsByUserIdAndGuildId(targetUser.id, interaction.guild.id);
    const totalPages = Math.ceil(totalInfractions.length / ITEMS_PER_PAGE);

    const page = interaction.fields.getTextInputValue('page');
    const newPageIndex = parseInt(page, 10) - 1;

    if (isNaN(newPageIndex) || newPageIndex < 0 || newPageIndex > totalPages - 1) {
      await interaction.reply({
        content: 'Invalid page number. Please enter a valid number.',
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    const pageInfractions = totalInfractions.slice(newPageIndex * ITEMS_PER_PAGE, (newPageIndex + 1) * ITEMS_PER_PAGE);

    await interaction.deferUpdate();

    const client = interaction.client as ExtendedClient;

    const staffEmoji = client.customEmojis.staff;
    const dateEmoji = client.customEmojis.date;
    const calendarEmoji = client.customEmojis.calendar;
    const receiptEmoji = client.customEmojis.receipt;
    const pencilEmoji = client.customEmojis.pencil;
    const infinityEmoji = client.customEmojis.infinity;
    const banEmoji = client.customEmojis.ban;
    const hammerEmoji = client.customEmojis.hammer;
    const exclamationEmoji = client.customEmojis.exclamation;
    const clockEmoji = client.customEmojis.clock;
    const backwardsEmoji = client.customEmojis.backwards;
    const forwardsEmoji = client.customEmojis.forwards;
    const nextEmoji = client.customEmojis.forwardstep;
    const previousEmoji = client.customEmojis.backwardstep;

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.White)
          .setAuthor({ name: `${targetUser.displayName} - Overview`, iconURL: targetUser.displayAvatarURL() })
          .setDescription(
            [
              `${infinityEmoji} Total: ${totalInfractions.length}`,
              `${banEmoji} Bans: ${totalInfractions.filter((infraction) => infraction.type === InfractionType.Ban).length}`,
              `${calendarEmoji} Tempbans: ${totalInfractions.filter((infraction) => infraction.type === InfractionType.Tempban).length}`,
              `${hammerEmoji} Kicks: ${totalInfractions.filter((infraction) => infraction.type === InfractionType.Kick).length}`,
              `${exclamationEmoji} Warns: ${totalInfractions.filter((infraction) => infraction.type === InfractionType.Warn).length}`,
              `${clockEmoji} Timeouts: ${totalInfractions.filter((infraction) => infraction.type === InfractionType.Timeout).length}`,
            ].join('\n'),
          ),
        // Map through the infractions and create an embed for each
        ...pageInfractions.map((infraction) =>
          infraction.expiresAt
            ? new EmbedBuilder()
                .setColor(Colors.White)
                .setDescription(
                  [
                    `**${infraction.id}**`,
                    `${receiptEmoji} Type: ${infraction.type}`,
                    `${pencilEmoji} Reason: ${infraction.reason}`,
                    `${staffEmoji} Moderator: <@${infraction.moderatorId}>`,
                    `${calendarEmoji} ${infraction.isActive ? 'Expires' : 'Expired'}: ${time(Math.floor(infraction.expiresAt.getTime() / 1_000), TimestampStyles.ShortDateTime)}`,
                    `${dateEmoji} Date: ${time(Math.floor(infraction.createdAt.getTime() / 1_000), TimestampStyles.ShortDateTime)}`,
                  ].join('\n'),
                )
            : new EmbedBuilder()
                .setColor(Colors.White)
                .setDescription(
                  [
                    `**${infraction.id}**`,
                    `${receiptEmoji} Type: ${infraction.type}`,
                    `${pencilEmoji} Reason: ${infraction.reason}`,
                    `${staffEmoji} Moderator: <@${infraction.moderatorId}>`,
                    `${dateEmoji} Date: ${time(Math.floor(infraction.createdAt.getTime() / 1_000), TimestampStyles.ShortDateTime)}`,
                  ].join('\n'),
                ),
        ),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`infractions-first_${targetUser.id}`) // No need to pass the page index to the first button
            .setEmoji({ id: backwardsEmoji.id })
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(newPageIndex === 0), // Disable if on the first page
          new ButtonBuilder()
            .setCustomId(`infractions-previous_${newPageIndex}_${targetUser.id}`) // Pass the page index to the previous button
            .setEmoji({ id: previousEmoji.id })
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(newPageIndex === 0), // Disable if on the first page
          new ButtonBuilder()
            .setCustomId(`infractions-custom_${targetUser.id}`)
            .setLabel(`${newPageIndex + 1} / ${totalPages}`)
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`infractions-next_${newPageIndex}_${targetUser.id}`) // Pass the page index to the next button
            .setEmoji({ id: nextEmoji.id })
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(newPageIndex === totalPages - 1), // Disable if on the last page
          new ButtonBuilder()
            .setCustomId(`infractions-last_${targetUser.id}`) // No need to pass the page index to the last button
            .setEmoji({ id: forwardsEmoji.id })
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(newPageIndex === totalPages - 1), // Disable if on the last page
        ),
      ],
    });
  },
});
