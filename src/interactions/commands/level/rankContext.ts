import { Font, RankCardBuilder } from 'canvacord';
import { ApplicationCommandType, ApplicationIntegrationType, AttachmentBuilder, ContextMenuCommandBuilder, InteractionContextType } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { convertLevelToXP, getLevelWithRank } from 'db/level';

const commandType = ApplicationCommandType.User;

export default new Command<typeof commandType>({
  module: ModuleType.Level,
  botPermissions: ['SendMessages'],
  data: new ContextMenuCommandBuilder()
    .setName('rank-context')
    .setType(commandType)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild),
  async execute({ interaction, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const { options, guild } = interaction;

    const target = options.getUser('user', true);
    const member = guild.members.cache.get(target.id);

    const rank = await getLevelWithRank(target.id, guild.id);
    if (!rank) return interaction.editReply(t('level.none', { lng }));

    Font.loadDefault();

    const card = new RankCardBuilder()
      .setStatus(member?.presence?.status ?? 'none')
      .setAvatar(target.displayAvatarURL({ size: 1024, forceStatic: true, extension: 'png' }))
      .setUsername(target.username)
      .setDisplayName(target.displayName)
      .setRank(rank.position)
      .setLevel(rank.level)
      .setCurrentXP(rank.xp)
      .setRequiredXP(convertLevelToXP(rank.level + 1));

    const image = await card.build();

    if (image) {
      await interaction.editReply({
        files: [new AttachmentBuilder(image, { name: 'rank.png' })],
      });
      return;
    }
  },
});
