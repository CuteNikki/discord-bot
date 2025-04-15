import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

import { Button } from 'classes/button';

export default new Button({
  customId: 'modal',
  execute(interaction) {
    interaction.showModal(
      new ModalBuilder()
        .setCustomId('test')
        .setTitle('Test Modal')
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('test')
              .setLabel('Test Input')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Enter something here')
              .setRequired(true),
          ),
        ),
    );
  },
});
