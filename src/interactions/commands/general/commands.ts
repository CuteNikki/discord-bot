import {
  ActionRowBuilder,
  ApplicationCommandType,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
  StringSelectMenuBuilder
} from 'discord.js';
import { t } from 'i18next';
import ms from 'ms';

import { Command, ModuleType } from 'classes/command';

import { getUserLanguage } from 'db/user';

import { chunk } from 'utils/common';
import { logger } from 'utils/logger';
import { pagination } from 'utils/pagination';

const TIMEOUT = 60_000;

export default new Command({
  module: ModuleType.General,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('commands')
    .setDescription('List of all commands')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to false will show the message to everyone').setRequired(false)),
  async execute({ interaction, client, lng }) {
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const categories = Object.values(ModuleType)
      .filter((category) => typeof category !== 'string' && category !== ModuleType.Developer)
      .map((category) => ({
        label: ModuleType[category as number],
        value: category.toString()
      }));

    const select = new StringSelectMenuBuilder()
      .setCustomId('select-help-category')
      .setMaxValues(1)
      .setPlaceholder(t('commands.placeholder', { lng }))
      .setOptions(...categories);

    const helpEmbed = new EmbedBuilder()
      .setColor(client.colors.general)
      .setTitle(t('commands.title', { lng }))
      .setDescription(t('commands.description', { lng, categories: categories.length }));

    const msg = await interaction
      .editReply({
        embeds: [helpEmbed],
        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)]
      })
      .catch((err) => logger.debug({ err }, 'Could not send help message'));

    if (!msg) {
      return;
    }

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      idle: TIMEOUT
    });

    collector.on('collect', async (selectInteraction) => {
      await selectInteraction.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));

      if (selectInteraction.user.id !== interaction.user.id) {
        await interaction
          .followUp({
            content: t('interactions.author-only', {
              lng: await getUserLanguage(selectInteraction.user.id)
            }),
            ephemeral: true
          })
          .catch((err) => logger.debug({ err }, 'Could not send author only message'));
        return;
      }

      const categoryId = parseInt(selectInteraction.values[0]);
      const categoryName = ModuleType[categoryId];

      const commands: Command<ApplicationCommandType.ChatInput>[] = client.commands
        .map((cmd) => cmd)
        .filter(
          (cmd) =>
            cmd.options.data.toJSON().type !== ApplicationCommandType.Message &&
            cmd.options.data.toJSON().type !== ApplicationCommandType.User &&
            cmd.options.module === categoryId
        );

      const mappedCmds = commands.map((cmd) => ({
        name: cmd.options.data.name,
        description: cmd.options.data.description
      }));

      const chunkedCmds = chunk(mappedCmds, 10);

      const applicationCmds = await interaction.client.application.commands.fetch();

      await pagination({
        interaction,
        ephemeral,
        disableButtons: false,
        extraButton: new ButtonBuilder().setCustomId('button-help-back').setEmoji('🔙').setStyle(ButtonStyle.Danger),
        extraButtonFunction: async (int) => {
          await int
            .editReply({
              embeds: [helpEmbed],
              components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)]
            })
            .catch((err) => logger.debug({ err }, 'Could not edit help message'));
          return;
        },
        embeds: chunkedCmds.map((chunk) =>
          new EmbedBuilder()
            .setColor(client.colors.general)
            .setTitle(categoryName)
            .addFields(
              chunk.map((cmd) => ({
                name: `</${cmd.name}:${applicationCmds.find((c) => c.name === cmd.name)?.id}>`,
                value: cmd.description
              }))
            )
        )
      });
    });

    collector.on('end', () => {
      interaction
        .editReply({
          embeds: [
            helpEmbed.setFooter({
              text: t('pagination', { lng, time: ms(TIMEOUT, { long: true }) })
            })
          ],
          components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select.setDisabled(true))]
        })
        .catch((err) => logger.debug({ err }, 'Could not edit help message'));
    });
  }
});
