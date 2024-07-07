import { ApplicationCommandType, Colors, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

import { infractionModel } from 'models/infraction';

import { chunk, pagination } from 'utils/pagination';

export default new Command({
  module: ModuleType.Moderation,
  data: {
    name: 'View Infractions',
    type: ApplicationCommandType.User,
    contexts: [Contexts.Guild],
    integration_types: [IntegrationTypes.GuildInstall],
    default_member_permissions: `${PermissionFlagsBits.ModerateMembers}`,
  },
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply({ ephemeral: true });

    const { options, user, guildId } = interaction;

    const lng = await client.getUserLanguage(user.id);

    const target = options.getUser('user', true);

    const targetInfractions = await infractionModel.find({ guildId, userId: target.id }).lean().exec();
    if (!targetInfractions.length) return interaction.editReply(i18next.t('infractions.history.none', { lng }));
    const chunkedInfractions = chunk(
      targetInfractions.sort((a, b) => b.createdAt - a.createdAt),
      3
    );

    const infractionTypes = {
      0: i18next.t('infractions.types.ban', { lng }),
      1: i18next.t('infractions.types.unban', { lng }),
      2: i18next.t('infractions.types.tempban', { lng }),
      3: i18next.t('infractions.types.kick', { lng }),
      4: i18next.t('infractions.types.timeout', { lng }),
      5: i18next.t('infractions.types.warn', { lng }),
    };

    await pagination({
      client,
      interaction,
      embeds: chunkedInfractions.map((chunk, index) =>
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle(i18next.t('infractions.history.title', { lng, page: index + 1, pages: chunkedInfractions.length }))
          .setDescription(
            chunk
              .map((infraction) =>
                [
                  i18next.t('infractions.history.id', { lng, id: infraction._id }),
                  i18next.t('infractions.history.type', { lng, type: infractionTypes[infraction.action as keyof typeof infractionTypes] }),
                  i18next.t('infractions.history.moderator', { lng, moderator: `<@${infraction.moderatorId}>` }),
                  i18next.t('infractions.history.reason', { lng, reason: infraction.reason ?? '/' }),
                  i18next.t('infractions.history.date', { lng, date: `<t:${Math.floor(infraction.createdAt / 1000)}:f>` }),
                  infraction.endsAt ? i18next.t('infractions.history.ends_at', { lng, date: `<t:${Math.floor(infraction.endsAt / 1000)}:f>` }) : '',
                ].join('\n')
              )
              .join('\n\n')
          )
      ),
    });
  },
});
