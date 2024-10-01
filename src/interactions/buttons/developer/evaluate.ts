import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

import { Button } from 'classes/button';

export default new Button({
  customId: 'button-eval-edit',
  isDeveloperOnly: true,
  async execute({ interaction }) {
    await interaction.showModal(
      new ModalBuilder()
        .setCustomId('modal_eval')
        .setTitle('Evaluate code')
        .setComponents(
          new ActionRowBuilder<TextInputBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId('code')
              .setLabel('code to evaluate')
              .setValue(
                interaction.message.embeds[0].description?.replace('```js', '').split('').reverse().join('').replace('```', '').split('').reverse().join('') ??
                  ''
              )
              .setPlaceholder('console.log("hello world!");')
              .setMaxLength(4000)
              .setRequired(true)
              .setStyle(TextInputStyle.Paragraph)
          ),
          new ActionRowBuilder<TextInputBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId('depth')
              .setLabel('inspect depth (numbers only)')
              .setValue('2')
              .setMaxLength(1)
              .setRequired(true)
              .setStyle(TextInputStyle.Short)
          )
        )
    );
  }
});
