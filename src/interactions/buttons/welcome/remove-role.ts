import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

export default new Button({
  customId: 'button-welcome-remove-role',
  permissions: ['ManageGuild'],
  isAuthorOnly: true,
  async execute({ interaction, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.showModal(
      new ModalBuilder()
        .setCustomId('modal-welcome-remove-role')
        .setTitle(t('welcome.roles.remove-role-modal-title', { lng }))
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('role-id')
              .setLabel(t('welcome.roles.remove-role-modal-input', { lng }))
              .setStyle(TextInputStyle.Short)
              .setRequired(true),
          ),
        ),
    );
  },
});
