import { Modal } from 'classes/modal';

export default new Modal({
  customId: 'test',
  execute(interaction) {
    const inputValue = interaction.fields.getTextInputValue('test');

    interaction.reply({
      content: `Test modal executed! Input value: ${inputValue}`,
    });
  },
});
