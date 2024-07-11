import i18next from 'i18next';

import { Button } from 'classes/button';

import { infractionModel, InfractionType } from 'models/infraction';

export default new Button({
  customId: 'button-kick',
  isAuthorOnly: false,
  isCustomIdIncluded: true,
  permissions: [],
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { guild } = interaction;

    const targetId = interaction.customId.split('_')[1];
    const targetMember = await guild.members.fetch(targetId).catch(() => {});

    const lng = await client.getUserLanguage(interaction.user.id);

    if (!targetMember) return interaction.reply(i18next.t('kick.target.invalid', { lng }));
    const targetLng = await client.getUserLanguage(targetId);
    const reason = 'Suspicious Account';

    const kicked = await targetMember.kick(reason).catch(() => {});
    if (!kicked) return interaction.reply(i18next.t('kick.failed', { lng }));

    const receivedDM = await client.users
      .send(targetMember.user.id, {
        content: i18next.t('kick.target_dm', {
          lng: targetLng,
          guild: `\`${guild.name}\``,
          reason: `\`${reason ?? '/'}\``,
        }),
      })
      .catch(() => {});
    await interaction.reply({
      content: [
        i18next.t('kick.confirmed', { lng, user: targetMember.toString(), reason: `\`${reason ?? '/'}\`` }),
        receivedDM ? i18next.t('kick.dm_received', { lng }) : i18next.t('kick.dm_not_received', { lng }),
      ].join('\n'),
      components: [],
    });

    if (targetMember.user.bot) return;
    await infractionModel.create({
      guildId: guild.id,
      userId: targetMember.id,
      moderatorId: interaction.user.id,
      action: InfractionType.Kick,
      createdAt: Date.now(),
      reason,
    });
  },
});
