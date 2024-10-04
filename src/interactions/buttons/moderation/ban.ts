import { t } from 'i18next';

import { Button } from 'classes/button';

import { createInfraction } from 'db/infraction';
import { getUserLanguage } from 'db/language';

import { InfractionType } from 'types/infraction';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-ban_',
  isAuthorOnly: false,
  isCustomIdIncluded: true,
  permissions: ['BanMembers'],
  botPermissions: ['BanMembers', 'SendMessages'],
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    const { guild } = interaction;
    const targetId = interaction.customId.split('_')[1];

    const target = await client.users.fetch(targetId).catch((err) => logger.debug({ err, targetId }, 'Could not fetch user'));

    if (!target) {
      await interaction.reply(t('ban.failed', { lng }));
      return;
    }

    const targetLng = await getUserLanguage(targetId);
    const reason = 'Suspicious Account';

    const banned = await guild.bans
      .create(target.id, { reason, deleteMessageSeconds: 604800 })
      .catch((err) => logger.debug({ err, targetId }, 'Could not ban user'));

    if (!banned) {
      await interaction.reply(t('ban.failed', { lng }));
      return;
    }

    const historyOptions = {
      0: t('ban.history.none', { lng }), // 'Delete none'
      1800: t('ban.history.minutes-30', { lng }), // 'Previous 30 minutes'
      3600: t('ban.history.minutes-60', { lng }), // 'Previous 60 minutes'
      10800: t('ban.history.hours-3', { lng }), // 'Previous 3 hours'
      21600: t('ban.history.hours-6', { lng }), //'Previous 6 hours'
      43200: t('ban.history.hours-12', { lng }), // 'Previous 12 hours'
      86400: t('ban.history.hours-24', { lng }), // 'Previous 24 hours'
      259200: t('ban.history.days-3', { lng }), // 'Previous 3 days'
      604800: t('ban.history.days-7', { lng }) // 'Previous 7 days'
    };

    const receivedDM = await client.users
      .send(target.id, {
        content: t('ban.target-dm', {
          lng: targetLng,
          guild: `\`${guild.name}\``,
          reason: `\`${reason ?? t('none', { lng: targetLng })}\``,
          duration: 'forever'
        })
      })
      .catch((err) => logger.debug({ err, targetId }, 'Could not send DM to user'));

    await interaction.reply({
      content: [
        t('ban.confirmed', {
          lng,
          user: target.toString(),
          reason: `\`${reason ?? t('none', { lng: targetLng })}\``
        }),
        t('ban.deleted-history', { lng, deleted: historyOptions[604800] }),
        receivedDM ? t('ban.dm-received', { lng }) : t('ban.dm-not-received', { lng }),
        t('ban.permanent', { lng })
      ].join('\n'),
      components: []
    });

    if (target.bot) {
      return;
    }

    await createInfraction(guild.id, target.id, interaction.user.id, InfractionType.Ban, reason, undefined, Date.now(), true);
  }
});
