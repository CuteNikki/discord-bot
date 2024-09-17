import { EmbedBuilder } from 'discord.js';
import { t } from 'i18next';

import { Modal } from 'classes/modal';

import { getGuildSettings, updateGuildSettings } from 'db/guild';
import { getUserLanguage } from 'db/user';

export default new Modal({
  customId: 'modal-welcome-add-role',
  permissions: ['ManageGuild'],
  async execute({ client, interaction }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply();
    const lng = await getUserLanguage(interaction.user.id);

    const roleId = interaction.fields.getTextInputValue('role-id');
    const config = await getGuildSettings(interaction.guild.id);

    if (config.welcome.roles.includes(roleId)) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('welcome.roles.already', { lng, roleId }))],
      });
    }
    if (!interaction.guild.roles.cache.has(roleId)) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('welcome.roles.invalid', { lng, roleId }))],
      });
    }

    await updateGuildSettings(interaction.guild.id, {
      $push: { ['welcome.roles']: roleId },
    });

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.welcome).setDescription(t('welcome.roles.added', { lng, role: `<@&${roleId}>` }))],
    });
  },
});
