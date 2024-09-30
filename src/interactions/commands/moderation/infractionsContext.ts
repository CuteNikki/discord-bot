import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  Colors,
  ContextMenuCommandBuilder,
  EmbedBuilder,
  InteractionContextType,
  PermissionFlagsBits
} from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { getInfractions } from 'db/infraction';

import { chunk } from 'utils/common';
import { pagination } from 'utils/pagination';

const commandType = ApplicationCommandType.User;

export default new Command<typeof commandType>({
  module: ModuleType.Moderation,
  botPermissions: ['SendMessages'],
  data: new ContextMenuCommandBuilder()
    .setName('infractions-context')
    .setType(commandType)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild),
  async execute({ interaction, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const { guildId } = interaction;

    const target = interaction.targetUser;
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
                    staff: `<@${infraction.staffId}>`
                  }),
                  t('infractions.history.reason', {
                    lng,
                    reason: infraction.reason ?? t('none', { lng })
                  }),
                  t('infractions.history.date', {
                    lng,
                    date: `<t:${Math.floor(infraction.createdAt / 1000)}:f>`
                  }),
                  t('infractions.history.ends_at', {
                    lng,
                    date: infraction.endsAt ? `<t:${Math.floor(infraction.endsAt / 1000)}:f>` : t('none', { lng })
                  })
                ].join('\n')
              )
              .join('\n\n')
          )
      )
    });
  }
});
