import { ApplicationCommandOptionType } from 'discord.js';
import i18next from 'i18next';

import { Command } from 'classes/command';

import { userModel } from 'models/user';

export default new Command({
  data: {
    name: 'language',
    description: 'Manage the bot language',
    options: [{ name: 'language', description: 'The new language to set', type: ApplicationCommandOptionType.String }],
  },
  async execute({ interaction, client }) {
    await interaction.deferReply({ ephemeral: true });
    const { user, options } = interaction;

    const lng = client.getLanguage(user.id);
    const language = options.getString('language', false);

    if (!language) {
      return interaction.editReply({ content: i18next.t('commands.language.current', { lng }) });
    } else if (language) {
      if (!client.supportedLanguages.includes(language))
        return interaction.editReply({
          content: [
            i18next.t('commands.language.invalid', { lng, language }),
            i18next.t('commands.language.supported', { lng, languages: client.supportedLanguages.map((value) => `\`${value}\``).join(', ') }),
          ].join('\n'),
        });
      try {
        await userModel.findOneAndUpdate({ userId: user.id }, { $set: { language } }, { new: true, upsert: true }).lean().exec();
        client.languages.set(user.id, language);
        return interaction.editReply({ content: i18next.t('commands.language.success', { lng, language }) });
      } catch (err) {
        return interaction.editReply({ content: i18next.t('commands.language.error', { lng }) });
      }
    }
  },
});
