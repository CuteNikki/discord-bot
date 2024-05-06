import { GoogleTranslator } from '@translate-tools/core/translators/GoogleTranslator';
import { ApplicationCommandType } from 'discord.js';

import { Command, Contexts, IntegrationTypes } from 'classes/command';

export default new Command({
  data: {
    name: 'Translate',
    type: ApplicationCommandType.Message,
    contexts: [Contexts.GUILD, Contexts.BOT_DM, Contexts.PRIVATE_CHANNEL],
    integration_types: [IntegrationTypes.GUILD_INSTALL, IntegrationTypes.USER_INSTALL],
  },
  async execute({ interaction, client }) {
    const { user, targetMessage } = interaction;
    await interaction.deferReply({ ephemeral: true });

    const lng = client.getLanguage(user.id);

    const translator = new GoogleTranslator({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
      },
    });

    const translated = await translator.translate(targetMessage.content, 'auto', lng);

    interaction.editReply(translated);
  },
});
