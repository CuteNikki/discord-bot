import { ApplicationCommandType } from 'discord.js';
import i18next from 'i18next';

import { Command, Context, IntegrationTypes } from 'classes/command';

export default new Command({
  data: {
    name: 'ping',
    description: 'Replies with Pong!',
    type: ApplicationCommandType.ChatInput,
    contexts: [Context.GUILD, Context.BOT_DM, Context.PRIVATE_CHANNEL],
    integration_types: [IntegrationTypes.GUILD_INSTALL, IntegrationTypes.USER_INSTALL],
  },
  execute({ interaction, client }) {
    const lng = client.getLanguage(interaction.user.id);

    interaction.reply({ content: i18next.t('ping', { lng }) });
  },
});
