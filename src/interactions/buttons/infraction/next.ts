import { MessageFlags } from 'discord.js';

import { Button } from 'classes/button';
import type { ExtendedClient } from 'classes/client';

import { getInfractionsByUserIdAndGuildId } from 'database/infraction';

import { buildInfractionOverview } from 'utility/infraction';
import logger from 'utility/logger';

export default new Button({
  customId: 'infractions-next',
  includeCustomId: true,
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const targetUserId = interaction.customId.split('_')[2];
    const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);

    if (!targetUser) {
      await interaction.reply({
        content: 'User not found.',
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    await interaction.deferUpdate();

    const infractions = await getInfractionsByUserIdAndGuildId(targetUser.id, interaction.guild.id).catch((err) =>
      logger.error({ err }, 'Failed to get infractions'),
    );
    if (!infractions) return;

    const client = interaction.client as ExtendedClient;
    const currentPage = parseInt(interaction.customId.split('_')[1], 10); // Get the current page index from the custom ID

    const itemsPerPage = 3;

    return interaction.editReply(
      buildInfractionOverview({
        client,
        infractions,
        targetUser,
        itemsPerPage,
        page: currentPage + 1, // Increment the page index
      }),
    );
  },
});
