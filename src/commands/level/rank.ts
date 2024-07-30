import { Font, RankCardBuilder } from 'canvacord';
import { ApplicationIntegrationType, AttachmentBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { getDataWithRank, getWeeklyDataWithRank, levelToXP, type PositionLevel } from 'utils/level';
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
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { options, guildId, user, guild } = interaction;

    const ephemeral = options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const lng = await client.getUserLanguage(user.id);

    const target = options.getUser('user', false) ?? user;
    const member = guild.members.cache.get(target.id);

    const weekly = options.getBoolean('weekly', false) ?? false;

    let rank: PositionLevel | undefined;
    if (!weekly) rank = await getDataWithRank({ userId: target.id, guildId }, client);
    else rank = await getWeeklyDataWithRank({ userId: target.id, guildId }, client);

    if (!rank) return interaction.editReply(t('level.none', { lng }));

    Font.loadDefault();

    const card = new RankCardBuilder()
      .setDisplayName(target.displayName)
      .setUsername(target.username)
      .setAvatar(
        target.displayAvatarURL({
          size: 1024,
          forceStatic: true,
          extension: 'png',
        }),
      )
      .setCurrentXP(rank.xp)
      .setRequiredXP(levelToXP(rank.level + 1))
      .setLevel(rank.level)
      .setRank(rank.position)
      .setStatus(member?.presence?.status ?? 'none');
    const image = await card.build({ format: 'png' }).catch((err) => logger.debug({ err }, 'Could not build rank card'));
    if (image)
      return interaction.editReply({
        files: [new AttachmentBuilder(image, { name: 'rank.png' })],
      });
  },
});
