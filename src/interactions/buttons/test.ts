import { Button } from 'classes/button';

export default new Button({
  customId: 'test',
  execute(interaction) {
    interaction.reply({
      content: 'Test button executed!',
    });
  },
});
