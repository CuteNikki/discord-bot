import { ApplicationIntegrationType, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { getUserLanguage, updateUserLanguage } from 'db/user';
import { getGuildLanguage, updateGuildLanguage } from 'db/guild';

import { supportedLanguages } from 'utils/language';

export default new Command({
  module: ModuleType.General,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('language')
    .setDescription('See or change the language of replies by the bot')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('user')
        .setDescription('Your personal language preference')
        .addStringOption((option) => option.setName('language').setDescription('The new language to set').setAutocomplete(true).setRequired(false)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('server')
        .setDescription("The server's language preference")
        .addStringOption((option) => option.setName('language').setDescription('The new language to set').setAutocomplete(true).setRequired(false)),
    ),
  async autocomplete({ interaction }) {
    const choices = supportedLanguages;
    const focused = interaction.options.getFocused();
    if (!focused.length) return interaction.respond(choices.map((choice) => ({ name: choice, value: choice })).slice(0, 25));
    const filtered = choices.filter((choice) => choice.toLowerCase().includes(focused.toLowerCase()));
    await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })).slice(0, 25));
  },
  async execute({ interaction, client }) {
    await interaction.deferReply({ ephemeral: true });
    const { user, options } = interaction;

    const lng = await getUserLanguage(user.id);
    const guildLng = await getGuildLanguage(interaction.guildId);

    switch (options.getSubcommand()) {
      case 'user':
        {
          const language = options.getString('language', false);

          if (!language) {
            return interaction.editReply({
              content: t('language.current', { lng, language: lng }),
            });
          } else if (language) {
            if (!supportedLanguages.includes(language))
              return interaction.editReply({
                content: [
                  t('language.invalid', { lng, language }),
                  t('language.supported', {
                    lng,
                    languages: supportedLanguages.map((value) => `\`${value}\``).join(', '),
                  }),
                ].join('\n'),
              });
            await updateUserLanguage(user.id, language);
            return interaction.editReply({
              content: t('language.success', { lng, language }),
            });
          }
        }
        break;
      case 'server':
        {
          const language = options.getString('language', false);

          if (!interaction.inCachedGuild())
            return interaction.editReply({
              content: t('language.invalid_guild', { lng }),
            });

          if (!language) {
            return interaction.editReply({
              content: t('language.current', { lng, language: guildLng }),
            });
          } else if (language) {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild))
              return interaction.editReply({
                content: t('language.no_permission', { lng }),
              });

            if (!supportedLanguages.includes(language))
              return interaction.editReply({
                content: [
                  t('language.invalid', { lng, language }),
                  t('language.supported', {
                    lng,
                    languages: supportedLanguages.map((value) => `\`${value}\``).join(', '),
                  }),
                ].join('\n'),
              });

            await updateGuildLanguage(interaction.guildId, language);
            return interaction.editReply({
              content: t('language.success', { lng, language }),
            });
          }
        }
        break;
    }
  },
});
