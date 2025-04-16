import { SelectMenu } from 'classes/select';

export default new SelectMenu({
  customId: 'select',
  cooldown: 0,
  execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;

    const selectedOptions = interaction.values;

    interaction.reply({
      content: 'Test select menu executed: ' + selectedOptions.join(', '),
    });
  },
});
