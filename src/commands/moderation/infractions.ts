import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes } from 'classes/command';

import { infractionModel } from 'models/infraction';

import { chunk, pagination } from 'utils/pagination';

export default new Command({
  data: {
    name: 'infractions',
    description: 'Manage infractions of a user',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
    default_member_permissions: `${PermissionFlagsBits.ModerateMembers}`,
    options: [
      {
        name: 'history',
        description: 'Shows infractions of a user',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'The user to see the history of',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: 'delete',
        description: 'Deletes an infraction',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'infraction',
            description: 'The id of the infraction',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  },
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { options, user, guildId } = interaction;

    const lng = await client.getLanguage(user.id);

    switch (options.getSubcommand()) {
      case 'history':
        await interaction.deferReply({ ephemeral: true });
        const target = options.getUser('user', true);

        const targetInfractions = await infractionModel.find({ guildId, userId: target.id }).lean().exec();
        if (!targetInfractions.length) return interaction.editReply(i18next.t('infractions.history.none', { lng }));
        const chunkedInfractions = chunk(
          targetInfractions.sort((a, b) => b.createdAt - a.createdAt),
          3
        );

        const types = {
          BAN: i18next.t('infractions.types.ban', { lng }),
          UNBAN: i18next.t('infractions.types.unban', { lng }),
          TEMPBAN: i18next.t('infractions.types.tempban', { lng }),
          KICK: i18next.t('infractions.types.kick', { lng }),
          TIMEOUT: i18next.t('infractions.types.timeout', { lng }),
          WARN: i18next.t('infractions.types.warn', { lng }),
        };

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
                      i18next.t('infractions.history.type', { lng, type: types[infraction.action] }),
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
        break;
      case 'delete':
        const infractionId = options.getString('infraction', true);
        const infraction = await infractionModel.findById(infractionId).lean().exec();
        if (!infraction || infraction.guildId !== guildId) return interaction.reply(i18next.t('infractions.delete.invalid', { lng }));

        await infractionModel.findByIdAndDelete(infractionId).lean().exec();
        interaction.reply(i18next.t('infractions.delete.success', { lng }));
        break;
    }
  },
});
