import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

export default new Button({
  customId: 'button-welcome-add-role',
  permissions: ['ManageGuild'],
  isAuthorOnly: true,
  async execute({ client, interaction }) {
    const lng = await client.getUserLanguage(interaction.user.id);

    await interaction.showModal(
      new ModalBuilder()
        .setCustomId('modal-welcome-add-role')
        .setTitle(t('welcome.roles.add-role-modal-title', { lng }))
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('role-id')
              .setLabel(t('welcome.roles.add-role-modal-input', { lng }))
              .setStyle(TextInputStyle.Short)
              .setRequired(true),
          ),
        ),
    );
  },
});
