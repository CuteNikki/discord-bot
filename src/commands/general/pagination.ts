import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

import { Command } from 'classes/command';
import { Pagination } from 'classes/pagination';

import logger from 'utility/logger';

export default new Command({
  builder: new SlashCommandBuilder()
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .setName('pagination')
    .setDescription('A demonstration of pagination'),
  async execute(interaction) {
    await interaction.deferReply();

    const mockData = [
      { userId: '303142922780672001', xp: 9500 },
      { userId: '303142922780672002', xp: 9400 },
      { userId: '303142922780672003', xp: 9400 },
      { userId: '303142922780672004', xp: 9200 },
      { userId: '303142922780672005', xp: 9100 },
      { userId: '303142922780672006', xp: 9000 },
      { userId: '303142922780672007', xp: 8800 },
      { userId: '303142922780672008', xp: 8700 },
      { userId: '303142922780672009', xp: 8600 },
      { userId: '303142922780672010', xp: 8500 },
      { userId: '303142922780672011', xp: 8400 },
      { userId: '303142922780672012', xp: 8300 },
      { userId: '303142922780672013', xp: 8200 },
      { userId: '303142922780672014', xp: 8100 },
      { userId: '303142922780672015', xp: 8000 },
    ].sort((a, b) => a.xp - b.xp); // Sort the mock data by xp in descending order
    // Mock data for pagination

    // DB example (xp leaderboard):
    // const mockData = await prisma.xp.findMany({
    //   where: { guildId: interaction.guildId },
    //   orderBy: { xp: 'desc' },
    //   select: { userId: true, xp: true },
    // });

    const ITEMS_PER_PAGE = 3;

    new Pagination({
      interaction: interaction,
      getTotalPages: () => Math.ceil(mockData.length / ITEMS_PER_PAGE),
      getPageContent: (pageIndex, _totalPages, locate) => {
        const start = pageIndex * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const items = mockData.slice(start, end);
        return [
          new EmbedBuilder().setDescription(
            items
              .map((item) =>
                locate === item.userId ? `**XP: ${item.xp} | ID: <@${item.userId}>** 📍` : `XP: ${item.xp} | ID: <@${item.userId}>`,
              )
              .join('\n'),
          ),
        ];
      },
      buttons: [
        // First page button
        () => ({
          data: new ButtonBuilder().setCustomId('pagination_first').setStyle(ButtonStyle.Secondary).setEmoji({ name: '⏪' }),
          disableOn: (index) => index === 0,
          onClick: () => ({ newIndex: 0 }),
        }),
        // Previous page button
        () => ({
          data: new ButtonBuilder().setCustomId('pagination_previous').setStyle(ButtonStyle.Secondary).setEmoji({ name: '⬅️' }),
          disableOn: (index) => index === 0,
          onClick: (index) => ({ newIndex: index > 0 ? index - 1 : index }),
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
          data: new ButtonBuilder().setCustomId('pagination_next').setStyle(ButtonStyle.Secondary).setEmoji({ name: '➡️' }),
          disableOn: (index, totalPages) => index === totalPages - 1,
          onClick: (index, totalPages) => ({ newIndex: index < totalPages - 1 ? index + 1 : index }),
        }),
        // Last page button
        () => ({
          data: new ButtonBuilder().setCustomId('pagination_last').setStyle(ButtonStyle.Secondary).setEmoji({ name: '⏩' }),
          disableOn: (index, totalPages) => index === totalPages - 1,
          onClick: (_index, totalPages) => ({ newIndex: totalPages - 1 }),
        }),
        () => ({
          data: new ButtonBuilder().setCustomId('pagination_locate').setStyle(ButtonStyle.Secondary).setEmoji({ name: '📍' }),
          disableOn: () => false,
          onClick: () => {
            // Get the page index of where the user is located
            const userId = interaction.user.id;

            const userEntry = mockData.find((entry) => entry.userId === userId);
            // DB example (xp leaderboard):
            // const userEntry = prisma.xp.findUnique({ where: { userId }, select: { xp: true } });

            if (!userEntry) return { newIndex: -1 };

            const countAbove = mockData.filter((entry) => entry.xp < userEntry.xp).length;
            // DB example (xp leaderboard):
            // const countAbove = await prisma.xp.count({ where: { xp: { gt: userEntry.xp } } });
            // For this to work, the xp must be sorted in descending order

            const pageIndex = Math.floor(countAbove / ITEMS_PER_PAGE);
            return { newIndex: pageIndex, locate: userId };
          },
        }),
        () => ({
          data: new ButtonBuilder().setCustomId('pagination_refresh').setStyle(ButtonStyle.Secondary).setEmoji({ name: '🔄' }),
          disableOn: () => false,
          onClick: (index) => {
            // Refresh the pagination to the current index
            return { newIndex: index };
          },
        }),
      ],
    });
  },
});
