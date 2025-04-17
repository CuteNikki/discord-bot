import { MessageFlags } from 'discord.js';

import { Button } from 'classes/button';
import type { ExtendedClient } from 'classes/client';

import { getInfractionsByUserIdAndGuildId } from 'database/infraction';

import { buildInfractionOverview } from 'utility/infraction';

export default new Button({
  customId: 'infractions-last',
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

    await interaction.deferUpdate();

    const client = interaction.client as ExtendedClient;

    const infractions = await getInfractionsByUserIdAndGuildId(targetUser.id, interaction.guild.id);
    const itemsPerPage = 3;

    return interaction.editReply(
      buildInfractionOverview({
        client,
        infractions,
        targetUser,
        itemsPerPage,
        page: Math.floor(infractions.length / itemsPerPage) - 1,
      }),
    );
  },
});
