import { ApplicationIntegrationType, AttachmentBuilder, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { LeaderboardBuilder } from 'classes/balance-leaderboard';
import { Command } from 'classes/command';

import { computeLeaderboard, getLeaderboard } from 'db/user';

import { chunk } from 'utils/common';
import { pagination } from 'utils/pagination';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Economy,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Shows the richest users')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to false will show the message to everyone').setRequired(false)),
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) {
      return;
    }

    const { options } = interaction;

    const ephemeral = options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const leaderboard = await getLeaderboard();
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
        players: chunkedLeaderboard[i].map((user) => ({
          avatar: user.avatar,
          username: user.username ?? user.userId,
          displayName: user.displayName ?? 'Unknown User',
          rank: user.position,
          bank: user.bank,
          wallet: user.wallet
        }))
      });
      if (i === 0) {
        leaderboardBuilder.setVariant('default');
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
