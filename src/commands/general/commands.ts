import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  ComponentType,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';
import ms from 'ms';
import { chunk, pagination } from 'utils/pagination';

export default new Command({
  module: ModuleType.General,
  data: {
    name: 'commands',
    description: 'List of all commands',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.Guild, Contexts.BotDM, Contexts.PrivateChannel],
    integration_types: [IntegrationTypes.GuildInstall, IntegrationTypes.UserInstall],
    options: [
      {
        name: 'ephemeral',
        description: 'When set to false will show the message to everyone',
        type: ApplicationCommandOptionType.Boolean,
      },
    ],
  },
  async execute({ interaction, client }) {
    const lng = await client.getUserLanguage(interaction.user.id);
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const categories = Object.values(ModuleType)
      .filter((category) => typeof category !== 'string' && category !== ModuleType.Developer)
      .map((category) => ({ label: ModuleType[category as number], value: category.toString() }));
    const select = new StringSelectMenuBuilder()
      .setCustomId('HELP_SELECT')
      .setMaxValues(1)
      .setPlaceholder(i18next.t('commands.placeholder', { lng }))
      .setOptions(...categories);
    const helpEmbed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle(i18next.t('commands.title', { lng }))
      .setDescription(i18next.t('commands.description', { lng, categories: categories.length }));
    const msg = await interaction
      .editReply({
        embeds: [helpEmbed],
        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
      })
      .catch(() => {});
    if (!msg) return;

    const TIME = 60_000;
    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, idle: TIME });

    collector.on('collect', async (selectInteraction) => {
      await selectInteraction.deferUpdate().catch(() => {});

      if (selectInteraction.user.id !== interaction.user.id)
        return await interaction
          .followUp({
            content: i18next.t('interactions.author_only', { lng: await client.getUserLanguage(selectInteraction.user.id) }),
            ephemeral: true,
          })
          .catch(() => {});

      const categoryId = parseInt(selectInteraction.values[0]);
      const categoryName = ModuleType[categoryId];

      const commands: Command<ApplicationCommandType.ChatInput>[] = client.commands
        .toJSON()
        .filter((cmd) => cmd.options.module === categoryId && cmd.options.data.type === ApplicationCommandType.ChatInput);
      const mappedCmds = commands.map((cmd) => ({ name: cmd.options.data.name, description: cmd.options.data.description }));
      const chunkedCmds = chunk(mappedCmds, 10);

      const applicationCmds = await interaction.client.application.commands.fetch();

      await pagination({
        client,
        interaction,
        ephemeral,
        disableButtons: false,
        extraButton: new ButtonBuilder().setCustomId('HELP_BACK').setEmoji('🔙').setStyle(ButtonStyle.Danger),
        extraButtonFunction: (int) =>
          int
            .editReply({
              embeds: [helpEmbed],
              components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
            })
            .catch(() => {}),
        embeds: chunkedCmds.map((chunk) =>
          new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle(categoryName)
            .addFields(chunk.map((cmd) => ({ name: `</${cmd.name}:${applicationCmds.find((c) => c.name === cmd.name)?.id}>`, value: cmd.description })))
        ),
      });
    });

    collector.on('end', () => {
      interaction
        .editReply({
          embeds: [helpEmbed.setFooter({ text: i18next.t('pagination', { lng, time: ms(TIME, { long: true }) }) })],
          components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select.setDisabled(true))],
        })
        .catch(() => {});
    });
  },
});
