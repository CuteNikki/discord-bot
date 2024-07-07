import { GoogleTranslator } from '@translate-tools/core/translators/GoogleTranslator';
import { ApplicationCommandType, Colors, EmbedBuilder, codeBlock } from 'discord.js';

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';
import i18next from 'i18next';

export default new Command({
  module: Modules.UTILITIES,
  data: {
    name: 'Translate',
    type: ApplicationCommandType.Message,
    contexts: [Contexts.GUILD, Contexts.BOT_DM, Contexts.PRIVATE_CHANNEL],
    integration_types: [IntegrationTypes.GUILD_INSTALL, IntegrationTypes.USER_INSTALL],
  },
  async execute({ interaction, client }) {
    const { user, targetMessage } = interaction;
    await interaction.deferReply({ ephemeral: true });

    const lng = await client.getUserLanguage(user.id);

    const translator = new GoogleTranslator({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
      },
    });

    if (!targetMessage.content) return interaction.editReply(i18next.t('translate.none', { lng }));
    const translated = await translator.translate(targetMessage.content, 'auto', lng);
    if (!translated) return interaction.editReply(i18next.t('translate.none', { lng }));

    interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Aqua)
          .setTitle(i18next.t('translate.title', { lng }))
          .addFields(
            { name: i18next.t('translate.input', { lng }), value: codeBlock(targetMessage.content.substring(0, 4000)) },
            { name: i18next.t('translate.output', { lng }), value: codeBlock(translated.substring(0, 4000)) }
          ),
      ],
    });
  },
});
