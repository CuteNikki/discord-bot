import i18next from 'i18next';

import { Button } from 'classes/button';

import { infractionModel, InfractionType } from 'models/infraction';

export default new Button({
  customId: 'button-ban',
  isAuthorOnly: false,
  isCustomIdIncluded: true,
  permissions: [],
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { guild } = interaction;

    const targetId = interaction.customId.split('_')[1];
    const target = await client.users.fetch(targetId).catch(() => {});

    const lng = await client.getUserLanguage(interaction.user.id);

    if (!target) return interaction.reply(i18next.t('ban.failed', { lng }));
    
    const targetLng = await client.getUserLanguage(targetId);
    const reason = 'Suspicious Account';

    const banned = await guild.bans.create(target.id, { reason, deleteMessageSeconds: 604800 }).catch(() => {});
    if (!banned) return interaction.reply(i18next.t('ban.failed', { lng }));

    const historyOptions = {
      0: i18next.t('ban.history.none', { lng }), // 'Delete none'
      1800: i18next.t('ban.history.minutes_30', { lng }), // 'Previous 30 minutes'
      3600: i18next.t('ban.history.minutes_60', { lng }), // 'Previous 60 minutes'
      10800: i18next.t('ban.history.hours_3', { lng }), // 'Previous 3 hours'
      21600: i18next.t('ban.history.hours_6', { lng }), //'Previous 6 hours'
      43200: i18next.t('ban.history.hours_12', { lng }), // 'Previous 12 hours'
      86400: i18next.t('ban.history.hours_24', { lng }), // 'Previous 24 hours'
      259200: i18next.t('ban.history.days_3', { lng }), // 'Previous 3 days'
      604800: i18next.t('ban.history.days_7', { lng }), // 'Previous 7 days'
    };

    const receivedDM = await client.users
      .send(target.id, {
        content: i18next.t('ban.target_dm', {
          lng: targetLng,
          guild: `\`${guild.name}\``,
          reason: `\`${reason ?? '/'}\``,
          duration: 'forever',
        }),
      })
      .catch(() => {});
    await interaction.reply({
      content: [
        i18next.t('ban.confirmed', { lng, user: target.toString(), reason: `\`${reason ?? '/'}\`` }),
        i18next.t('ban.deleted_history', { lng, deleted: historyOptions[604800] }),
        receivedDM ? i18next.t('ban.dm_received', { lng }) : i18next.t('ban.dm_not_received', { lng }),
        i18next.t('ban.permanent', { lng }),
      ].join('\n'),
      components: [],
    });

    if (target.bot) return;
    await infractionModel.create({
      guildId: guild.id,
      userId: target.id,
      moderatorId: interaction.user.id,
      action: InfractionType.Ban,
      closed: true,
      endsAt: undefined,
      createdAt: Date.now(),
      reason,
    });
  },
});
