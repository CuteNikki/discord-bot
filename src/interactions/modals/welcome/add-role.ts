import { EmbedBuilder } from 'discord.js';
import { t } from 'i18next';

import { Modal } from 'classes/modal';

import { addWelcomeRole, getWelcome } from 'db/welcome';

import { ModuleType } from 'types/interactions';

export default new Modal({
  module: ModuleType.Welcome,
  customId: 'modal-welcome-add-role',
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

    if (welcome.roles.includes(roleId)) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('welcome.roles.already', { lng, roleId }))]
      });
      return;
    }

    if (!interaction.guild.roles.cache.has(roleId)) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('welcome.roles.invalid', { lng, roleId }))]
      });
      return;
    }

    await addWelcomeRole(interaction.guild.id, roleId);

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.welcome).setDescription(t('welcome.roles.added', { lng, role: `<@&${roleId}>` }))]
    });
  }
});
