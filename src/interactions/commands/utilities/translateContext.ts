import { GoogleTranslator } from '@translate-tools/core/translators/GoogleTranslator';
import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  Colors,
  ContextMenuCommandBuilder,
  EmbedBuilder,
  InteractionContextType,
  codeBlock
} from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

const commandType = ApplicationCommandType.Message;

export default new Command<typeof commandType>({
  module: ModuleType.Utilities,
  botPermissions: ['SendMessages'],
  data: new ContextMenuCommandBuilder()
    .setName('translate-context')
    // @ts-expect-error: This is an issue with DiscordJS typings version mismatch in v14.16.3
    .setType(commandType)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
  async execute({ interaction, client, lng }) {
    await interaction.deferReply({ ephemeral: true });

    const { targetMessage } = interaction;

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
              value: codeBlock(targetMessage.content.length > 1000 ? targetMessage.content.substring(0, 1000) + '...' : targetMessage.content)
            },
            {
              name: t('translate.output', { lng }),
              value: codeBlock(translated.length > 1000 ? translated.substring(0, 1000) + '...' : translated)
            }
          )
      ]
    });
  }
});
