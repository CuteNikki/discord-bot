import { GoogleTranslator } from '@translate-tools/core/translators/GoogleTranslator';
import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  Colors,
  ContextMenuCommandBuilder,
  EmbedBuilder,
  InteractionContextType,
  codeBlock,
} from 'discord.js';
import { t } from 'i18next';

import { getUserLanguage } from 'db/user';

import { Command, ModuleType } from 'classes/command';

const commandType = ApplicationCommandType.Message;

export default new Command<typeof commandType>({
  module: ModuleType.Utilities,
  botPermissions: ['SendMessages'],
  data: new ContextMenuCommandBuilder()
    .setName('translate-context')
    .setType(commandType)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
  async execute({ interaction, client }) {
    await interaction.deferReply({ ephemeral: true });

    const { user, targetMessage } = interaction;
    const lng = await getUserLanguage(user.id);

    const translator = new GoogleTranslator();

    if (!targetMessage.content) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(t('translate.none', { lng }))] });
      return;
    }

    const translated = await translator.translate(targetMessage.content, 'auto', lng);
    if (!translated) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(t('translate.none', { lng }))] });
      return;
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.utilities)
          .setTitle(t('translate.title', { lng }))
          .addFields(
            {
              name: t('translate.input', { lng }),
              value: codeBlock(targetMessage.content.substring(0, 4000)),
            },
            {
              name: t('translate.output', { lng }),
              value: codeBlock(translated.substring(0, 4000)),
            },
          ),
      ],
    });
  },
});
