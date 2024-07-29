import { t } from 'i18next';

import { Button } from 'classes/button';

import { infractionModel, InfractionType } from 'models/infraction';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-kick',
  isAuthorOnly: false,
  isCustomIdIncluded: true,
  permissions: ['KickMembers'],
  botPermissions: ['KickMembers', 'SendMessages'],
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { guild } = interaction;

    const targetId = interaction.customId.split('_')[1];
    const targetMember = await guild.members.fetch(targetId).catch((error) => logger.debug({ error, targetId }, 'Could not fetch user'));

    const lng = await client.getUserLanguage(interaction.user.id);

    if (!targetMember) return interaction.reply(t('kick.target.invalid', { lng }));
    const targetLng = await client.getUserLanguage(targetId);
    const reason = 'Suspicious Account';

    const kicked = await targetMember.kick(reason).catch((error) => logger.debug({ error, targetId }, 'Could not kick user'));
    if (!kicked) return interaction.reply(t('kick.failed', { lng }));

    const receivedDM = await client.users
      .send(targetMember.user.id, {
        content: t('kick.target_dm', {
          lng: targetLng,
          guild: `\`${guild.name}\``,
          reason: `\`${reason ?? '/'}\``,
        }),
      })
      .catch((error) => logger.debug({ error, targetId }, 'Could not send DM to user'));
    await interaction.reply({
      content: [
        t('kick.confirmed', {
          lng,
          user: targetMember.toString(),
          reason: `\`${reason ?? '/'}\``,
        }),
        receivedDM ? t('kick.dm_received', { lng }) : t('kick.dm_not_received', { lng }),
      ].join('\n'),
      components: [],
    });

    if (targetMember.user.bot) return;
    await infractionModel.create({
      guildId: guild.id,
      userId: targetMember.id,
      staffId: interaction.user.id,
      action: InfractionType.Kick,
      createdAt: Date.now(),
      reason,
    });
  },
});
