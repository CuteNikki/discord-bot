import { MessageFlags } from 'discord.js';

import type { ExtendedClient } from 'classes/client';
import { Modal } from 'classes/modal';

import { getInfractionsByUserIdAndGuildId } from 'database/infraction';
import { buildInfractionOverview } from 'utility/infraction';

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

    const infractions = await getInfractionsByUserIdAndGuildId(targetUser.id, interaction.guild.id);
    const itemsPerPage = 3;
    const totalPages = Math.ceil(infractions.length / itemsPerPage);

    const page = interaction.fields.getTextInputValue('page');
    const newPageIndex = parseInt(page, 10) - 1;

    if (isNaN(newPageIndex) || newPageIndex < 0 || newPageIndex > totalPages - 1) {
      await interaction.reply({
        content: `Invalid page number. Please enter a valid number between 1 and ${totalPages}.`,
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    await interaction.deferUpdate();

    const client = interaction.client as ExtendedClient;

    return interaction.editReply(
      buildInfractionOverview({
        client,
        infractions,
        targetUser,
        itemsPerPage,
        page: newPageIndex,
      }),
    );
  },
});
