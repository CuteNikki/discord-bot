import { Command } from 'classes/command';
import i18next from 'i18next';

export default new Command({
  data: { name: 'ping', description: 'Replies with Pong!' },
  execute({ interaction, client }) {
    const lng = client.getLanguage(interaction.user.id);

    interaction.reply({ content: i18next.t('commands.ping', { lng }) });
  },
});
