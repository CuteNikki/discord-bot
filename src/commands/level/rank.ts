import { Font, RankCardBuilder } from 'canvacord';
import { ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';
import { getDataWithRank, getWeeklyDataWithRank, levelToXP, type PositionLevel } from 'utils/level';

export default new Command({
  module: Modules.LEVEL,
  data: {
    name: 'rank',
    description: 'Shows the rank of a user',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
    options: [
      {
        name: 'user',
        description: 'The user to show the rank of',
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: 'weekly',
        description: 'When set to true will show the users weekly rank',
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
      {
        name: 'ephemeral',
        description: 'When set to false will show the message to everyone',
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
    ],
  },
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

    if (!rank) return interaction.editReply(i18next.t('level.none', { lng }));

    Font.loadDefault();

    const card = new RankCardBuilder()
      .setDisplayName(target.displayName)
      .setUsername(target.username)
      .setAvatar(target.displayAvatarURL({ size: 1024, forceStatic: true, extension: 'png' }))
      .setCurrentXP(rank.xp)
      .setRequiredXP(levelToXP(rank.level + 1))
      .setLevel(rank.level)
      .setRank(rank.position)
      .setStatus(member?.presence?.status ?? 'none');
    const image = await card.build({ format: 'png' }).catch(() => {});
    if (image) return interaction.editReply({ files: [new AttachmentBuilder(image, { name: 'rank.png' })] });
  },
});
