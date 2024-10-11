import { EmbedBuilder } from 'discord.js';
import { t } from 'i18next';

import { Modal } from 'classes/modal';

import { getWelcome, removeWelcomeRole } from 'db/welcome';

import { ModuleType } from 'types/interactions';

export default new Modal({
  module: ModuleType.Welcome,
  customId: 'modal-welcome-remove-role',
  permissions: ['ManageGuild'],
  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply();

    const roleId = interaction.fields.getTextInputValue('role-id');

    const welcome = (await getWelcome(interaction.guild.id)) ?? {
      enabled: false,
      roles: [] as string[],
      message: { content: null, embed: {} },
      channelId: undefined
    };

    if (!welcome.roles.includes(roleId)) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('welcome.roles.none', { lng, roleId }))] });
      return;
    }

    await removeWelcomeRole(interaction.guild.id, roleId);

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.welcome).setDescription(t('welcome.roles.removed', { lng, roleId }))]
    });
  }
});
