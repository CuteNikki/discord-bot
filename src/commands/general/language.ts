import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

export default new Command({
  module: ModuleType.General,
  data: {
    name: 'language',
    description: 'Manage the bot language',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.Guild, Contexts.BotDM, Contexts.PrivateChannel],
    integration_types: [IntegrationTypes.GuildInstall, IntegrationTypes.UserInstall],
    options: [
      {
        name: 'language',
        description: 'The new language to set',
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
      },
    ],
  },
  async autocomplete({ interaction, client }) {
    const choices = client.supportedLanguages;
    const focused = interaction.options.getFocused();
    if (!focused.length) return interaction.respond(choices.map((choice) => ({ name: choice, value: choice })).slice(0, 25));
    const filtered = choices.filter((choice) => choice.toLowerCase().includes(focused.toLowerCase()));
    await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })).slice(0, 25));
  },
  async execute({ interaction, client }) {
    await interaction.deferReply({ ephemeral: true });
    const { user, options } = interaction;

    const lng = await client.getUserLanguage(user.id);
    const language = options.getString('language', false);

    if (!language) {
      return interaction.editReply({ content: i18next.t('language.current', { lng }) });
    } else if (language) {
      if (!client.supportedLanguages.includes(language))
        return interaction.editReply({
          content: [
            i18next.t('language.invalid', { lng, language }),
            i18next.t('language.supported', { lng, languages: client.supportedLanguages.map((value) => `\`${value}\``).join(', ') }),
          ].join('\n'),
        });
      try {
        await client.updateUserLanguage(user.id, language);
        return interaction.editReply({ content: i18next.t('language.success', { lng, language }) });
      } catch (err) {
        return interaction.editReply({ content: i18next.t('language.error', { lng }) });
      }
    }
  },
});
