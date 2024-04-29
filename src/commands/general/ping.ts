import { Command } from 'classes/command';

export default new Command({
  data: { name: 'ping', description: 'Replies with Pong!' },
  execute({ interaction }) {
    interaction.reply({ content: 'Pong!' });
  },
});
