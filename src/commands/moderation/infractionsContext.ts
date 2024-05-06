import { ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes } from 'classes/command';

import { infractionModel } from 'models/infraction';

import { chunk, pagination } from 'utils/pagination';

export default new Command({
  data: {
    name: 'View Infractions',
    type: ApplicationCommandType.User,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
  },
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { options, user, guildId } = interaction;

    const lng = await client.getLanguage(user.id);

    await interaction.deferReply({ ephemeral: true });
    const target = options.getUser('user', true);

    const targetInfractions = await infractionModel.find({ guildId, userId: target.id }).lean().exec();
    if (!targetInfractions.length) return interaction.editReply(i18next.t('infractions.history.none', { lng }));
    const chunkedInfractions = chunk(
      targetInfractions.sort((a, b) => b.createdAt - a.createdAt),
      3
    );

    await pagination({
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
                  i18next.t('infractions.history.type', { lng, type: infraction.action }),
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
