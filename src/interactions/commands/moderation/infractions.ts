import { InfractionType } from '@prisma/client';
import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  time,
  TimestampStyles,
} from 'discord.js';

import type { ExtendedClient } from 'classes/client';
import { Command } from 'classes/command';
import { Pagination } from 'classes/pagination';

import {
  deleteInfraction,
  getInfractionById,
  getInfractionsByUserIdAndGuildId,
  getInfractionsByUserIdAndGuildIdPaginated,
} from 'database/infraction';

import logger from 'utility/logger';

export default new Command({
  builder: new SlashCommandBuilder()
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setName('infractions')
    .setDescription('Manage infractions in the guild')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('history')
        .setDescription("View a user's infractions")
        .addUserOption((option) => option.setName('user').setDescription('The user to view infractions for').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription("Delete a user's infraction")
        .addUserOption((option) => option.setName('user').setDescription('The user to delete an infraction for').setRequired(true))
        .addStringOption((option) => option.setName('id').setDescription('The ID of the infraction to delete').setRequired(true)),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) {
      return await interaction.reply({
        content: 'This command can only be used in a server.',
        flags: [MessageFlags.Ephemeral],
      });
    }

    const client = interaction.client as ExtendedClient;

    switch (interaction.options.getSubcommand()) {
      case 'history':
        return await handleHistory(interaction);
      case 'delete':
        return await handleDelete(interaction);
      default:
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Red)
              .setDescription('Invalid subcommand. Please use `/infractions history` or `/infractions delete`.'),
          ],
          flags: [MessageFlags.Ephemeral],
        });
    }

    async function handleDelete(interaction: ChatInputCommandInteraction<'cached'>) {
      const targetUser = interaction.options.getUser('user', true);
      const infractionId = interaction.options.getString('id', true);

      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      const infraction = await getInfractionById(infractionId);

      if (!infraction || infraction.userId !== targetUser.id || infraction.guildId !== interaction.guild.id) {
        // If the infraction doesn't exist or doesn't belong to the user in the guild, return an error message
        logger.debug(
          { infractionId, targetUserId: targetUser.id, guildId: interaction.guild.id },
          'Infraction not found or does not belong to the user in the guild',
        );

        return await interaction.editReply({
          embeds: [
            new EmbedBuilder().setColor(Colors.Red).setDescription(`No infraction found with ID \`${infractionId}\` for ${targetUser}.`),
          ],
        });
      }

      // Delete the infraction from the database
      const deleted = await deleteInfraction(infractionId);

      logger.debug(
        { moderator: interaction.user.id, targetUserId: targetUser.id, infractionId, guildId: interaction.guild.id },
        deleted ? 'Infraction deleted' : 'Failed to delete infraction',
      );

      return await interaction.editReply({
        embeds: [
          deleted
            ? new EmbedBuilder()
                .setColor(Colors.Green)
                .setDescription(`Successfully deleted infraction \`${infractionId}\` for ${targetUser}.`)
            : new EmbedBuilder().setColor(Colors.Red).setDescription(`Failed to delete infraction \`${infractionId}\` for ${targetUser}.`),
        ],
      });
    }

    async function handleHistory(interaction: ChatInputCommandInteraction<'cached'>) {
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      const targetUser = interaction.options.getUser('user', true);

      if (targetUser.bot) {
        return await interaction.editReply({
          embeds: [
            new EmbedBuilder().setColor(Colors.Red).setDescription(`You cannot view infractions for bots because they are not tracked.`),
          ],
        });
      }

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

      const ITEMS_PER_PAGE = 3;

      const totalInfractions = await getInfractionsByUserIdAndGuildId(targetUser.id, interaction.guild.id);

      new Pagination({
        interaction: interaction,
        notFoundEmbed: new EmbedBuilder().setColor(Colors.Red).setDescription(`No infractions found for ${targetUser}!`),
        getTotalPages: async () => {
          return Math.ceil(totalInfractions.length / ITEMS_PER_PAGE);
        },
        getPageContent: async (pageIndex) => {
          // Get infractions for the current page
          const pageInfractions = await getInfractionsByUserIdAndGuildIdPaginated(
            targetUser.id,
            interaction.guild.id,
            pageIndex * ITEMS_PER_PAGE,
            ITEMS_PER_PAGE,
          );

          if (!pageInfractions.length) return null;

          return [
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
          ];
        },
        buttons: [
          // First page button
          () => ({
            data: new ButtonBuilder().setCustomId('pagination_first').setStyle(ButtonStyle.Secondary).setEmoji({ id: backwardsEmoji.id }),
            disableOn: (index) => index === 0, // Disable if on the first page
            onClick: () => ({ newIndex: 0 }), // Go to the first page
          }),
          // Previous page button
          () => ({
            data: new ButtonBuilder().setCustomId('pagination_previous').setStyle(ButtonStyle.Secondary).setEmoji({ id: previousEmoji.id }),
            disableOn: (index) => index === 0, // Disable if on the first page
            onClick: (index) => ({ newIndex: index > 0 ? index - 1 : index }), // Go to the previous page
          }),
          // Custom page button
          (index, totalPages) => ({
            data: new ButtonBuilder()
              .setCustomId('pagination_custom')
              .setStyle(ButtonStyle.Secondary)
              .setLabel(`${index + 1} / ${totalPages}`),
            disableOn: () => false,
            onClick: async (clickPageIndex, clickTotalPages, buttonInteraction) => {
              // Show the modal
              await buttonInteraction.showModal(
                new ModalBuilder()
                  .setCustomId('pagination_modal')
                  .setTitle('Custom Page')
                  .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('pagination_input')
                        .setLabel('Enter the page number you want to go to.')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder(`${clickPageIndex + 1}`),
                    ),
                  ),
              );

              try {
                // Await the modal submission
                const modalInteraction = await buttonInteraction.awaitModalSubmit({
                  time: 60_000,
                  idle: 60_000,
                  filter: (modalInteraction) => modalInteraction.customId === 'pagination_modal',
                });

                // Get the input value from the modal
                const newPage = parseInt(modalInteraction.fields.getTextInputValue('pagination_input'));

                // Validate the page number
                if (newPage > 0 && newPage <= clickTotalPages) {
                  await modalInteraction.deferUpdate(); // Acknowledge the modal submission

                  // Return the valid new page index (adjusted for 0-indexing)
                  return { newIndex: newPage - 1 };
                } else {
                  // If the page is invalid, show an error message
                  await modalInteraction.reply({
                    content: `Please enter a valid page number between 1 and ${clickTotalPages}.`,
                    flags: [MessageFlags.Ephemeral],
                  });
                }
              } catch (error) {
                // Log and handle modal errors (e.g., timeout or invalid input)
                logger.debug({ err: error }, 'Error processing modal submission');

                // Provide feedback to the user if the modal interaction failed
                if (error instanceof Error && error.message.toLowerCase().includes('timed out')) {
                  await buttonInteraction.followUp({
                    content: 'You took too long to respond. Please try again.',
                    flags: [MessageFlags.Ephemeral],
                  });
                }
              }

              // Return the current page index if there's an error or invalid input
              return { newIndex: clickPageIndex };
            },
          }),
          // Next page button
          () => ({
            data: new ButtonBuilder().setCustomId('pagination_next').setStyle(ButtonStyle.Secondary).setEmoji({ id: nextEmoji.id }),
            disableOn: (index, totalPages) => index === totalPages - 1, // Disable if on the last page
            onClick: (index, totalPages) => ({ newIndex: index < totalPages - 1 ? index + 1 : index }), // Go to the next page
          }),
          // Last page button
          () => ({
            data: new ButtonBuilder().setCustomId('pagination_last').setStyle(ButtonStyle.Secondary).setEmoji({ id: forwardsEmoji.id }),
            disableOn: (index, totalPages) => index === totalPages - 1, // Disable if on the last page
            onClick: (_index, totalPages) => ({ newIndex: totalPages - 1 }), // Go to the last page
          }),
        ],
      });
    }
  },
});
