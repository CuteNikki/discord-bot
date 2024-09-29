import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { computeLeaderboard, getLeaderboard, getWeeklyLeaderboard } from 'db/level';

import { chunk } from 'utils/common';
import { pagination } from 'utils/pagination';

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
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    const { options, guild } = interaction;

    const ephemeral = options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const weekly = options.getBoolean('weekly', false) ?? false;

    let leaderboard;

    if (weekly) {
      leaderboard = await getWeeklyLeaderboard(guild.id);
    } else {
      leaderboard = await getLeaderboard(guild.id);
    }

    const computedLeaderboard = await computeLeaderboard(leaderboard, client);

    const chunkedLeaderboard = chunk(computedLeaderboard, 10);
    if (!chunkedLeaderboard.length) return interaction.editReply(t('level.none'));

    await pagination({
      interaction,
      embeds: chunkedLeaderboard.map((level) =>
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle(weekly ? t('level.leaderboard.weekly', { lng }) : t('level.leaderboard.title', { lng }))
          .setDescription(
            level
              .map(
                ({ position, username, xp, level, userId }) =>
                  t('level.leaderboard.position', {
                    lng,
                    position,
                    username: username ?? userId,
                    xp,
                    level
                  }) + `${position === 1 ? ' 🥇' : position === 2 ? ' 🥈' : position === 3 ? ' 🥉' : ''}`
              )
              .join('\n')
          )
      )
    });
  }
});
