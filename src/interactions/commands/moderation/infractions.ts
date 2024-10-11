import {
  ApplicationIntegrationType,
  Colors,
  EmbedBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  time,
  TimestampStyles,
  userMention
} from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { deleteInfractionById, getInfractionById, getInfractions } from 'db/infraction';
import { getModeration } from 'db/moderation';

import { chunk } from 'utils/common';
import { pagination } from 'utils/pagination';

export default new Command({
  module: ModuleType.Moderation,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('infractions')
    .setDescription('Manage infractions of a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('history')
        .setDescription('Shows infractions of a user')
        .addUserOption((option) => option.setName('user').setDescription('The user to see the history of').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Deletes an infraction')
        .addStringOption((option) => option.setName('infraction').setDescription('The id of the infraction').setRequired(true))
    ),
  async execute({ interaction, lng }) {
    if (!interaction.inCachedGuild()) return;
    const { options, guildId, member } = interaction;

    const config = await getModeration(guildId, true);

    if (config.staffroleId && !member.permissions.has(PermissionFlagsBits.ModerateMembers) && !member.roles.cache.has(config.staffroleId)) {
      await interaction.editReply(t('moderation.staffrole.error', { lng }));
      return;
    }

    switch (options.getSubcommand()) {
      case 'history':
        {
          await interaction.deferReply({ ephemeral: true });

          const target = options.getUser('user', true);
          const targetInfractions = await getInfractions(guildId, target.id);

          if (!targetInfractions.length) {
            await interaction.editReply(t('infractions.history.none', { lng }));
            return;
          }

          const chunkedInfractions = chunk(
            targetInfractions.sort((a, b) => b.createdAt - a.createdAt),
            3
          );

          const infractionTypes = {
            0: t('infractions.types.ban', { lng }),
            1: t('infractions.types.unban', { lng }),
            2: t('infractions.types.tempban', { lng }),
            3: t('infractions.types.kick', { lng }),
            4: t('infractions.types.timeout', { lng }),
            5: t('infractions.types.warn', { lng })
          };

          await pagination({
            interaction,
            embeds: chunkedInfractions.map((chunk) =>
              new EmbedBuilder()
                .setColor(Colors.Orange)
                .setTitle(t('infractions.history.title', { lng }))
                .setDescription(
                  chunk
                    .map((infraction) =>
                      [
                        t('infractions.history.id', { lng, id: infraction._id.toString() }),
                        t('infractions.history.type', {
                          lng,
                          type: infractionTypes[infraction.action as keyof typeof infractionTypes]
                        }),
                        t('infractions.history.staff', {
                          lng,
                          staff: userMention(infraction.staffId)
                        }),
                        t('infractions.history.reason', {
                          lng,
                          reason: infraction.reason ?? t('none', { lng })
                        }),
                        t('infractions.history.date', {
                          lng,
                          date: time(Math.floor(infraction.createdAt / 1000), TimestampStyles.ShortDateTime)
                        }),
                        t('infractions.history.ends-at', {
                          lng,
                          date: infraction.endsAt ? time(Math.floor(infraction.endsAt / 1000), TimestampStyles.ShortDateTime) : t('none', { lng })
                        })
                      ].join('\n')
                    )
                    .join('\n\n')
                )
            )
          });
        }
        break;
      case 'delete':
        {
          const infractionId = options.getString('infraction', true);
          const infraction = await getInfractionById(infractionId);

          if (!infraction || infraction.guildId !== guildId) {
            await interaction.reply(t('infractions.delete.invalid', { lng }));
            return;
          }

          await deleteInfractionById(infractionId);
          interaction.reply(t('infractions.delete.success', { lng }));
        }
        break;
    }
  }
});
