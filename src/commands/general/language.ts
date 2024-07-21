import { ApplicationIntegrationType, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

export default new Command({
  module: ModuleType.General,
  data: new SlashCommandBuilder()
    .setName('language')
    .setDescription('See or change the language of replies by the bot')
    .setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addStringOption((option) => option.setName('language').setDescription('The new language to set').setAutocomplete(true).setRequired(true)),
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
      return interaction.editReply({ content: t('language.current', { lng }) });
    } else if (language) {
      if (!client.supportedLanguages.includes(language))
        return interaction.editReply({
          content: [
            t('language.invalid', { lng, language }),
            t('language.supported', { lng, languages: client.supportedLanguages.map((value) => `\`${value}\``).join(', ') }),
          ].join('\n'),
        });
      try {
        await client.updateUserLanguage(user.id, language);
        return interaction.editReply({ content: t('language.success', { lng, language }) });
      } catch (err) {
        return interaction.editReply({ content: t('language.error', { lng }) });
      }
    }
  },
});
