import { t } from 'i18next';

import { Button } from 'classes/button';

import { infractionModel, InfractionType } from 'models/infraction';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-ban',
  isAuthorOnly: false,
  isCustomIdIncluded: true,
  permissions: ['BanMembers'],
  botPermissions: ['BanMembers', 'SendMessages'],
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { guild } = interaction;

    const targetId = interaction.customId.split('_')[1];
    const target = await client.users.fetch(targetId).catch((err) => logger.debug({ err, targetId }, 'Could not fetch user'));

    const lng = await client.getUserLanguage(interaction.user.id);

    if (!target) return interaction.reply(t('ban.failed', { lng }));

    const targetLng = await client.getUserLanguage(targetId);
    const reason = 'Suspicious Account';

    const banned = await guild.bans
      .create(target.id, { reason, deleteMessageSeconds: 604800 })
      .catch((err) => logger.debug({ err, targetId }, 'Could not ban user'));
    if (!banned) return interaction.reply(t('ban.failed', { lng }));

    const historyOptions = {
      0: t('ban.history.none', { lng }), // 'Delete none'
      1800: t('ban.history.minutes_30', { lng }), // 'Previous 30 minutes'
      3600: t('ban.history.minutes_60', { lng }), // 'Previous 60 minutes'
      10800: t('ban.history.hours_3', { lng }), // 'Previous 3 hours'
      21600: t('ban.history.hours_6', { lng }), //'Previous 6 hours'
      43200: t('ban.history.hours_12', { lng }), // 'Previous 12 hours'
      86400: t('ban.history.hours_24', { lng }), // 'Previous 24 hours'
      259200: t('ban.history.days_3', { lng }), // 'Previous 3 days'
      604800: t('ban.history.days_7', { lng }), // 'Previous 7 days'
    };

    const receivedDM = await client.users
      .send(target.id, {
        content: t('ban.target_dm', {
          lng: targetLng,
          guild: `\`${guild.name}\``,
          reason: `\`${reason ?? '/'}\``,
          duration: 'forever',
        }),
      })
      .catch((err) => logger.debug({ err, targetId }, 'Could not send DM to user'));
    await interaction.reply({
      content: [
        t('ban.confirmed', {
          lng,
          user: target.toString(),
          reason: `\`${reason ?? '/'}\``,
        }),
        t('ban.deleted_history', { lng, deleted: historyOptions[604800] }),
        receivedDM ? t('ban.dm_received', { lng }) : t('ban.dm_not_received', { lng }),
        t('ban.permanent', { lng }),
      ].join('\n'),
      components: [],
    });

    if (target.bot) return;
    await infractionModel.create({
      guildId: guild.id,
      userId: target.id,
      staffId: interaction.user.id,
      action: InfractionType.Ban,
      closed: true,
      endsAt: undefined,
      createdAt: Date.now(),
      reason,
    });
  },
});
