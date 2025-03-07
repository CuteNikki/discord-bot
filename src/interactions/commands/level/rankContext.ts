import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  AttachmentBuilder,
  ContextMenuCommandBuilder,
  InteractionContextType,
  MessageFlags
} from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';
import { RankCard } from 'classes/level-card';

import { convertLevelToExp, getLevelWithRank } from 'db/level';

import { ModuleType } from 'types/interactions';

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

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const { options, guild } = interaction;

    const target = options.getUser('user', true);
    const member = guild.members.cache.get(target.id);

    const rank = await getLevelWithRank(target.id, guild.id);

    if (!rank) {
      return interaction.editReply(t('level.none', { lng }));
    }

    const card = new RankCard({
      avatar: target.displayAvatarURL({ extension: 'png', forceStatic: true, size: 1024 }),
      username: target.displayName,
      handle: target.username,
      status: member?.presence?.status ?? 'none',
      currentXP: rank.xp,
      requiredXP: convertLevelToExp(rank.level + 1),
      level: rank.level,
      rank: rank.position,
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
