import { ApplicationIntegrationType, AttachmentBuilder, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';
import { LeaderboardBuilder } from 'classes/rank-leaderboard';

import { computeLeaderboard, getLeaderboard, getWeeklyLeaderboard } from 'db/level';

import { chunk } from 'utils/common';
import { pagination } from 'utils/pagination';

import { ModuleType } from 'types/interactions';

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

    if (!computedLeaderboard.length) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.none', { lng }))] });
      return;
    }

    const chunkedLeaderboard = chunk(computedLeaderboard, 5);

    const embeds: EmbedBuilder[] = [];
    const attachments: AttachmentBuilder[] = [];

    for (let i = 0; i < chunkedLeaderboard.length; i++) {
      const leaderboardBuilder = new LeaderboardBuilder({
        players: chunkedLeaderboard[i].map((lvl) => ({
          avatar: lvl.avatar,
          username: lvl.username ?? lvl.userId,
          displayName: lvl.displayName ?? 'Unknown User',
          rank: lvl.position,
          level: lvl.level,
          xp: lvl.xp
        }))
      });

      if (i === 0) {
        leaderboardBuilder.setVariant('default');
        leaderboardBuilder.setHeader({ title: guild.name, subtitle: `${guild.memberCount} members`, image: guild.iconURL() ?? '' });
      } else {
        leaderboardBuilder.setVariant('horizontal');
      }

      const image = await leaderboardBuilder.build({ format: 'png' });

      attachments.push(new AttachmentBuilder(image, { name: `leaderboard_${i}.png` }));
      embeds.push(new EmbedBuilder().setColor(client.colors.level).setImage(`attachment://leaderboard_${i}.png`));
    }

    await pagination({ interaction, embeds, attachments });
  }
});
