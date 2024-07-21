import { Font, RankCardBuilder } from 'canvacord';
import { ApplicationCommandType, ApplicationIntegrationType, AttachmentBuilder, ContextMenuCommandBuilder, InteractionContextType } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';
import { getDataWithRank, levelToXP } from 'utils/level';

const commandType = ApplicationCommandType.User

export default new Command<typeof commandType>({
  module: ModuleType.Moderation,
  data: new ContextMenuCommandBuilder()
    .setName('View Rank')
    .setType(commandType)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall),
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply({ ephemeral: true });

    const { options, user, guild, guildId } = interaction;

    const lng = await client.getUserLanguage(user.id);

    const target = options.getUser('user', true);
    const member = guild.members.cache.get(target.id);

    const rank = await getDataWithRank({ userId: target.id, guildId }, client);
    if (!rank) return interaction.editReply(t('level.none', { lng }));

    Font.loadDefault();
    const card = new RankCardBuilder()
      .setStatus(member?.presence?.status ?? 'none')
      .setAvatar(target.displayAvatarURL({ size: 1024, forceStatic: true }))
      .setUsername(target.username)
      .setDisplayName(target.displayName)
      .setRank(rank.position)
      .setLevel(rank.level)
      .setCurrentXP(rank.xp)
      .setRequiredXP(levelToXP(rank.level + 1));
    const image = await card.build();

    return interaction.editReply({ files: [new AttachmentBuilder(image, { name: 'rank.png' })] });
  },
});
