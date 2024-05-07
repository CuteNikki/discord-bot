import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';

import { Command, Contexts, IntegrationTypes } from 'classes/command';

import { computeLeaderboard, getLeaderboard, getWeeklyLeaderboard } from 'utils/levels';
import { chunk, pagination } from 'utils/pagination';

export default new Command({
  data: {
    name: 'levels',
    description: 'Shows the level leaderboard',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
    options: [
      {
        name: 'weekly',
        description: 'When set to true will show the weekly leaderboard',
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
      {
        name: 'ephemeral',
        description: 'When set to false will show the message to everyone',
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
    ],
  },
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { options, guildId } = interaction;

    const ephemeral = options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const weekly = options.getBoolean('weekly', false) ?? false;

    let leaderboard;
    if (weekly) leaderboard = await getWeeklyLeaderboard(guildId);
    else leaderboard = await getLeaderboard(guildId);
    const computedLeaderboard = await computeLeaderboard(leaderboard, client);

    const chunkedLeaderboard = chunk(computedLeaderboard, 10);

    await pagination({
      interaction,
      embeds: chunkedLeaderboard.map((levels) =>
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle(weekly ? 'Weekly Leaderboard' : 'Leaderboard')
          .setDescription(levels.map((level) => `${level.position}. ${level.username} (${level.xp}XP/LVL${level.level})`).join('\n'))
      ),
    });
  },
});
