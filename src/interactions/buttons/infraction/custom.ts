import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

import { Button } from 'classes/button';

export default new Button({
  customId: 'infractions-custom',
  includeCustomId: true,
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const targetUserId = interaction.customId.split('_')[1];

    await interaction.showModal(
      new ModalBuilder()
        .setCustomId(`infractions-custom_${targetUserId}`)
        .setTitle('Custom Page')
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('page')
              .setLabel('Enter a page number')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('1')
              .setRequired(true),
          ),
        ),
    );
  },
});
