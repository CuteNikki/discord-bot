import { Font, RankCardBuilder } from 'canvacord';
import { ApplicationIntegrationType, AttachmentBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { convertLevelToXP, getLevelWithRank, getWeeklyLevelWithRank } from 'db/level';

import type { PositionLevel } from 'types/level';

import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.Level,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Shows the rank of a user')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) => option.setName('user').setDescription('The user to show the rank of').setRequired(false))
    .addBooleanOption((option) => option.setName('weekly').setDescription("When set to true will show the user's weekly rank").setRequired(false))
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to false will show the message to everyone').setRequired(false)),
  async execute({ interaction, lng }) {
    if (!interaction.inCachedGuild()) return;
    const { options, user, guild } = interaction;

    const ephemeral = options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const target = options.getUser('user', false) ?? user;
    const member = guild.members.cache.get(target.id);
    const weekly = options.getBoolean('weekly', false) ?? false;

    let rank: PositionLevel | undefined;

    if (!weekly) {
      rank = await getLevelWithRank(target.id, guild.id);
    } else {
      rank = await getWeeklyLevelWithRank(target.id, guild.id);
    }

    if (!rank) return interaction.editReply(t('level.none', { lng }));

    Font.loadDefault();

    const card = new RankCardBuilder()
      .setDisplayName(target.displayName)
      .setUsername(target.username)
      .setAvatar(target.displayAvatarURL({ size: 1024, forceStatic: true, extension: 'png' }))
      .setCurrentXP(rank.xp)
      .setRequiredXP(convertLevelToXP(rank.level + 1))
      .setLevel(rank.level)
      .setRank(rank.position)
      .setStatus(member?.presence?.status ?? 'none');

    const image = await card.build({ format: 'png' }).catch((err) => logger.debug({ err }, 'Could not build rank card'));

    if (image) {
      await interaction.editReply({
        files: [new AttachmentBuilder(image, { name: 'rank.png' })]
      });
      return;
    }
  }
});
