import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
  type CommandInteraction
} from 'discord.js';
import { t } from 'i18next';
import ms from 'ms';

import type { DiscordClient } from 'classes/client';

import { getUserLanguage } from 'db/language';

import { logger } from 'utils/logger';

enum CustomIds {
  First = 'button-pagination-first',
  Previous = 'button-pagination-prev',
  Page = 'button-pagination-page',
  Next = 'button-pagination-next',
  Last = 'button-pagination-last',
  PageModal = 'modal-pagination-page',
  PageInput = 'input-pagination-page'
}

export async function pagination({
  interaction,
  embeds,
  attachments,
  content,
  extraButton,
  extraButtonFunction,
  disableButtons = true,
  time = 60_000, // The time a user has to use the buttons before disabling them
  ephemeral = true, // If true, the pagination will only be visible to the user
  footer = true // If true, will replace the current embeds footer to tell that the buttons have been disabled because the time is over
}: {
  interaction: CommandInteraction;
  embeds: EmbedBuilder[];
  attachments?: AttachmentBuilder[];
  extraButton?: ButtonBuilder;
  extraButtonFunction?: (buttonInteraction: ButtonInteraction) => Promise<void>;
  content?: string;
  time?: number;
  ephemeral?: boolean;
  footer?: boolean;
  disableButtons?: boolean;
}) {
  if (!interaction.deferred) await interaction.deferReply({ flags: ephemeral ? [MessageFlags.Ephemeral] : undefined });
  const { user } = interaction;
  const lng = await getUserLanguage(user.id);

  const buttonFirst = new ButtonBuilder().setCustomId(CustomIds.First).setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true);
  const buttonPrev = new ButtonBuilder().setCustomId(CustomIds.Previous).setStyle(ButtonStyle.Secondary).setEmoji('⬅️').setDisabled(true);
  const buttonPage = new ButtonBuilder()
    .setCustomId(CustomIds.Page)
    .setStyle(ButtonStyle.Secondary)
    .setLabel(`1 / ${embeds.length}`)
    .setDisabled(embeds.length === 1 ? true : false);
  const buttonNext = new ButtonBuilder()
    .setCustomId(CustomIds.Next)
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('➡️')
    .setDisabled(embeds.length === 1 ? true : false);
  const buttonLast = new ButtonBuilder()
    .setCustomId(CustomIds.Last)
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('⏩')
    .setDisabled(embeds.length === 1 ? true : false);

  const components = [new ActionRowBuilder<ButtonBuilder>().setComponents(buttonFirst, buttonPrev, buttonPage, buttonNext, buttonLast)];
  if (extraButton) components.push(new ActionRowBuilder<ButtonBuilder>().setComponents(extraButton));

  let index = 0;
  const firstPageIndex = 0;
  const lastPageIndex = embeds.length - 1;

  async function updatePage(ci: ModalSubmitInteraction | ButtonInteraction, i: number) {
    if (index === firstPageIndex) {
      buttonFirst.setDisabled(true);
      buttonPrev.setDisabled(true);
    } else {
      buttonFirst.setDisabled(false);
      buttonPrev.setDisabled(false);
    }
    if (index === lastPageIndex) {
      buttonNext.setDisabled(true);
      buttonLast.setDisabled(true);
    } else {
      buttonNext.setDisabled(false);
      buttonLast.setDisabled(false);
    }
    buttonPage.setLabel(`${i + 1} / ${embeds.length} `);

    await ci
      .editReply({ embeds: [embeds[i]], files: attachments ? [attachments[i]] : [], components })
      .catch((err) => logger.debug({ err }, 'Could not edit message'));
  }

  const msg = await interaction
    .editReply({ content, embeds: [embeds[index]], files: attachments?.length ? [attachments[index]] : [], components })
    .catch((err) => logger.debug({ err }, 'Could not edit message'));
  if (!msg) return;

  const collector = msg.createMessageComponentCollector({
    filter: (i) => i.user.id === user.id,
    idle: time,
    componentType: ComponentType.Button
  });

  collector.on('collect', async (int) => {
    if (int.customId !== CustomIds.Page) {
      await int.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));
    }

    if (int.customId === CustomIds.First) {
      if (index > firstPageIndex) index = firstPageIndex;
    } else if (int.customId === CustomIds.Previous) {
      if (index > firstPageIndex) index--;
    } else if (int.customId === CustomIds.Next) {
      if (index < lastPageIndex) index++;
    } else if (int.customId === CustomIds.Last) {
      if (index < lastPageIndex) index = lastPageIndex;
    } else if (extraButton && extraButtonFunction) {
      collector.stop('extra');
      return await extraButtonFunction(int).catch((err) => logger.debug({ err }, 'Could not execute extra button function'));
    } else if (int.customId === CustomIds.Page) {
      await int
        .showModal(
          new ModalBuilder()
            .setCustomId(CustomIds.PageModal)
            .setTitle(t('pagination.page', { lng }))
            .setComponents(
              new ActionRowBuilder<TextInputBuilder>().setComponents(
                new TextInputBuilder()
                  .setCustomId(CustomIds.PageInput)
                  .setLabel(t('pagination.custom', { lng }))
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
              )
            )
        )
        .catch((err) => logger.debug({ err }, 'Could not show modal'));

      const submitted = await int
        .awaitModalSubmit({ time: 60_000, filter: (i) => i.customId === CustomIds.PageModal })
        .catch((err) => logger.debug({ err }, 'Could not await modal submit'));
      if (!submitted) return;
      await submitted.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));

      const submittedNumber = submitted.fields.getTextInputValue(CustomIds.PageInput);
      if (!submittedNumber) return;

      const number = parseInt(submittedNumber);
      if (isNaN(number) || number < 1 || number > embeds.length) {
        return submitted.editReply({
          embeds: [new EmbedBuilder().setColor((interaction.client as DiscordClient).colors.error).setDescription(t('pagination.invalid', { lng }))]
        });
      }

      index = number - 1;
      return updatePage(submitted, index);
    }

    return updatePage(int, index);
  });

  collector.on('end', async (_, reason) => {
    if (reason === 'extra') return;
    if (!disableButtons) return;

    if (extraButton) {
      extraButton.setDisabled(true);
    }
    buttonFirst.setDisabled(true);
    buttonPrev.setDisabled(true);
    buttonNext.setDisabled(true);
    buttonLast.setDisabled(true);
    buttonPage.setDisabled(true);

    interaction
      .editReply({
        embeds: [
          footer
            ? embeds[index].setFooter({
                text: t('pagination.disabled', { lng, time: ms(time, { long: true }) })
              })
            : embeds[index]
        ],
        components
      })
      .catch((err) => logger.debug({ err }, 'Could not edit message'));
  });
}
