import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { computeLeaderboard, getLeaderboard, getWeeklyLeaderboard } from 'utils/level';
import { chunk, pagination } from 'utils/pagination';

export default new Command({
  module: ModuleType.Level,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('levels')
    .setDescription('Shows the level leaderboard')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addBooleanOption((option) => option.setName('weekly').setDescription('When set to true will show the weekly leaderboard').setRequired(false))
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to false will show the message to everyone').setRequired(false)),
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { options, guildId } = interaction;
    const lng = await client.getUserLanguage(interaction.user.id);

    const ephemeral = options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const weekly = options.getBoolean('weekly', false) ?? false;

    let leaderboard;
    if (weekly) leaderboard = await getWeeklyLeaderboard(guildId);
    else leaderboard = await getLeaderboard(guildId);
    const computedLeaderboard = await computeLeaderboard(leaderboard, client);

    const chunkedLeaderboard = chunk(computedLeaderboard, 10);
    if (!chunkedLeaderboard.length) return interaction.editReply(t('level.none'));

    await pagination({
      client,
      interaction,
      embeds: chunkedLeaderboard.map((level, index) =>
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle(
            weekly
              ? t('level.leaderboard.weekly', {
                  lng,
                  page: index + 1,
                  pages: chunkedLeaderboard.length,
                })
              : t('level.leaderboard.title', {
                  lng,
                  page: index + 1,
                  pages: chunkedLeaderboard.length,
                }),
          )
          .setDescription(
            level
              .map(
                ({ position, username, xp, level }) =>
                  t('level.leaderboard.position', {
                    lng,
                    position,
                    username,
                    xp,
                    level,
                  }) + `${position === 1 ? ' 🥇' : position === 2 ? ' 🥈' : position === 3 ? ' 🥉' : ''}`,
              )
              .join('\n'),
          ),
      ),
    });
  },
});
