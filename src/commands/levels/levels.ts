import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';

import { computeLeaderboard, getLeaderboard, getWeeklyLeaderboard } from 'utils/levels';
import { chunk, pagination } from 'utils/pagination';

export default new Command({
  module: Modules.LEVELS,
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
    const lng = await client.getLanguage(interaction.user.id);

    const ephemeral = options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const weekly = options.getBoolean('weekly', false) ?? false;

    let leaderboard;
    if (weekly) leaderboard = await getWeeklyLeaderboard(guildId);
    else leaderboard = await getLeaderboard(guildId);
    const computedLeaderboard = await computeLeaderboard(leaderboard, client);

    const chunkedLeaderboard = chunk(computedLeaderboard, 10);
    if (!chunkedLeaderboard.length) return interaction.editReply(i18next.t('levels.none'));

    await pagination({
      interaction,
      embeds: chunkedLeaderboard.map((levels, index) =>
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle(
            weekly
              ? i18next.t('levels.leaderboard.weekly', { lng, page: index + 1, pages: chunkedLeaderboard.length })
              : i18next.t('levels.leaderboard.title', { lng, page: index + 1, pages: chunkedLeaderboard.length })
          )
          .setDescription(
            levels.map(({ position, username, xp, level }) => i18next.t('levels.leaderboard.position', { lng, position, username, xp, level })).join('\n')
          )
      ),
    });
  },
});
