import { Font, RankCardBuilder } from 'canvacord';
import { ApplicationCommandType, AttachmentBuilder } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';
import { getDataWithRank, levelToXP } from 'utils/levels';

export default new Command({
  module: Modules.MODERATION,
  data: {
    name: 'View Rank',
    type: ApplicationCommandType.User,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
  },
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply({ ephemeral: true });

    const { options, user, guild, guildId } = interaction;

    const lng = await client.getLanguage(user.id);

    const target = options.getUser('user', true);
    const member = guild.members.cache.get(target.id);

    const rank = await getDataWithRank({ userId: target.id, guildId }, client);
    if (!rank) return interaction.editReply(i18next.t('levels.none', { lng }));

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
