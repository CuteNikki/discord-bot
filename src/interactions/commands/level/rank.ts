import { ApplicationIntegrationType, AttachmentBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';
import { RankCard } from 'classes/rank-card';

import { convertLevelToXP, getLevelWithRank, getWeeklyLevelWithRank } from 'db/level';

import type { PositionLevel } from 'types/level';


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
  async execute({ client, interaction, lng }) {
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

    const card = new RankCard({
      avatar: target.displayAvatarURL({ extension: 'png', forceStatic: true, size: 1024 }),
      username: target.displayName,
      handle: target.username,
      status: member?.presence?.status ?? 'none',
      currentXP: rank.xp,
      requiredXP: convertLevelToXP(rank.level + 1),
      level: rank.level,
      rank: rank.position,
      abbreviate: true,
      styles: {
        progressbar: {
          thumb: `bg-[#${client.colors.level.toString(16)}]`
        }
      }
    });
    const image = await card.build({ format: 'png' });

    await interaction.editReply({
      files: [new AttachmentBuilder(image, { name: 'rank.png' })]
    });
  }
});
