import { EmbedBuilder } from 'discord.js';
import { t } from 'i18next';

import { Modal } from 'classes/modal';

import { getGuild, updateGuild } from 'db/guild';

import { ModuleType } from 'types/interactions';

export default new Modal({
  module: ModuleType.Welcome,
  customId: 'modal-welcome-remove-role',
  permissions: ['ManageGuild'],
  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply();

    const roleId = interaction.fields.getTextInputValue('role-id');

    const config = await getGuild(interaction.guild.id);

    if (!config.welcome.roles.includes(roleId)) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('welcome.roles.none', { lng, roleId }))] });
      return;
    }

    await updateGuild(interaction.guild.id, {
      $pull: { ['welcome.roles']: roleId }
    });

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.welcome).setDescription(t('welcome.roles.removed', { lng, roleId }))]
    });
  }
});
