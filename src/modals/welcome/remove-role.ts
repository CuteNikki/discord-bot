import { EmbedBuilder } from 'discord.js';
import { t } from 'i18next';

import { Modal } from 'classes/modal';

export default new Modal({
  customId: 'modal-welcome-remove-role',
  permissions: ['ManageGuild'],
  async execute({ client, interaction }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply();
    const lng = await client.getUserLanguage(interaction.user.id);

    const roleId = interaction.fields.getTextInputValue('role-id');
    const config = await client.getGuildSettings(interaction.guild.id);

    if (!config.welcome.roles.includes(roleId)) {
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('welcome.roles.none', { lng, roleId }))] });
    }

    await client.updateGuildSettings(interaction.guild.id, {
      $pull: { ['welcome.roles']: roleId },
    });

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.welcome).setDescription(t('welcome.roles.removed', { lng, roleId }))],
    });
  },
});
