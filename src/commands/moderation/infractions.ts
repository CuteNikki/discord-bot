import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  time,
  TimestampStyles,
} from 'discord.js';

import { Command } from 'classes/command';
import { Pagination } from 'classes/pagination';

import { getInfractionsByUserIdAndGuildId, getInfractionsByUserIdAndGuildIdPaginated } from 'database/infraction';

import logger from 'utility/logger';

export default new Command({
  builder: new SlashCommandBuilder()
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setName('infractions')
    .setDescription('Manage infractions in the guild')
    .addUserOption((option) => option.setName('user').setDescription('The user to view infractions for').setRequired(true)),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) {
      return;
    }

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const targetUser = interaction.options.getUser('user', true);

    const ITEMS_PER_PAGE = 3;

    new Pagination({
      interaction: interaction,
      notFoundEmbed: new EmbedBuilder().setColor(Colors.Red).setDescription(`No infractions found for ${targetUser.toString()}!`),
      getTotalPages: async () => {
        const totalInfractions = await getInfractionsByUserIdAndGuildId(targetUser.id, interaction.guild.id);
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

        return new EmbedBuilder()
          .setColor(Colors.DarkRed)
          .setDescription(`## Infractions of ${targetUser.toString()}`)
          .setThumbnail(targetUser.displayAvatarURL())
          .addFields(
            pageInfractions.map((infraction) => ({
              name: `${infraction.id}`,
              value: [
                `Type: ${infraction.type}`,
                `Reason: ${infraction.reason}`,
                `Moderator: <@${infraction.moderatorId}>`,
                `Date: ${time(Math.floor(infraction.createdAt.getTime() / 1_000), TimestampStyles.ShortDateTime)}`,
                infraction.expiresAt &&
                  `Expires: ${time(Math.floor(infraction.expiresAt.getTime() / 1_000), TimestampStyles.ShortDateTime)}`,
              ].join('\n'),
            })),
          );
      },
      buttons: [
        // First page button
        () => ({
          data: new ButtonBuilder().setCustomId('pagination_first').setStyle(ButtonStyle.Secondary).setEmoji({ name: '⏪' }),
          disableOn: (index) => index === 0,
          onClick: () => 0,
        }),
        // Previous page button
        () => ({
          data: new ButtonBuilder().setCustomId('pagination_previous').setStyle(ButtonStyle.Secondary).setEmoji({ name: '⬅️' }),
          disableOn: (index) => index === 0,
          onClick: (index) => (index > 0 ? index - 1 : index),
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
                return newPage - 1;
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
            return clickPageIndex;
          },
        }),
        // Next page button
        () => ({
          data: new ButtonBuilder().setCustomId('pagination_next').setStyle(ButtonStyle.Secondary).setEmoji({ name: '➡️' }),
          disableOn: (index, totalPages) => index === totalPages - 1,
          onClick: (index, totalPages) => (index < totalPages - 1 ? index + 1 : index),
        }),
        // Last page button
        () => ({
          data: new ButtonBuilder().setCustomId('pagination_last').setStyle(ButtonStyle.Secondary).setEmoji({ name: '⏩' }),
          disableOn: (index, totalPages) => index === totalPages - 1,
          onClick: (_index, totalPages) => totalPages - 1,
        }),
      ],
    });
  },
});
