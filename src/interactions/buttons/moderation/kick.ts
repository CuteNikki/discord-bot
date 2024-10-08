import { inlineCode } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { createInfraction } from 'db/infraction';
import { getUserLanguage } from 'db/language';

import { InfractionType } from 'types/infraction';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-kick_',
  isAuthorOnly: false,
  isCustomIdIncluded: true,
  permissions: ['KickMembers'],
  botPermissions: ['KickMembers', 'SendMessages'],
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    const { guild } = interaction;

    const targetId = interaction.customId.split('_')[1];
    const targetMember = await guild.members.fetch(targetId).catch((err) => logger.debug({ err, targetId }, 'Could not fetch user'));

    if (!targetMember) {
      await interaction.reply(t('kick.target.invalid', { lng }));
      return;
    }

    const targetLng = await getUserLanguage(targetId);
    const reason = 'Suspicious Account';

    const kicked = await targetMember.kick(reason).catch((err) => logger.debug({ err, targetId }, 'Could not kick user'));

    if (!kicked) {
      await interaction.reply(t('kick.failed', { lng }));
      return;
    }

    const receivedDM = await client.users
      .send(targetMember.user.id, {
        content: t('kick.target-dm', {
          lng: targetLng,
          guild: inlineCode(guild.name),
          reason: inlineCode(reason ?? t('none', { lng: targetLng }))
        })
      })
      .catch((err) => logger.debug({ err, targetId }, 'Could not send DM to user'));

    await interaction.reply({
      content: [
        t('kick.confirmed', {
          lng,
          user: targetMember.toString(),
          reason: inlineCode(reason ?? t('none', { lng }))
        }),
        receivedDM ? t('kick.dm-received', { lng }) : t('kick.dm-not-received', { lng })
      ].join('\n'),
      components: []
    });

    if (targetMember.user.bot) {
      return;
    }

    await createInfraction(guild.id, targetMember.id, interaction.user.id, InfractionType.Kick, reason, undefined, Date.now(), true);
  }
});
