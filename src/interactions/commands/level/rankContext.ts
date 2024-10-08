import { ApplicationCommandType, ApplicationIntegrationType, AttachmentBuilder, ContextMenuCommandBuilder, InteractionContextType } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { convertLevelToXP, getLevelWithRank } from 'db/level';
import { RankCard } from 'utils/rank-card';

const commandType = ApplicationCommandType.User;

export default new Command<typeof commandType>({
  module: ModuleType.Level,
  botPermissions: ['SendMessages'],
  data: new ContextMenuCommandBuilder()
    .setName('rank-context')
    .setType(commandType)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild),
  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const { options, guild } = interaction;

    const target = options.getUser('user', true);
    const member = guild.members.cache.get(target.id);

    const rank = await getLevelWithRank(target.id, guild.id);
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
