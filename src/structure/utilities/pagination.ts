import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, type CommandInteraction, type EmbedBuilder } from 'discord.js';
import i18next from 'i18next';
import ms from 'ms';

import type { DiscordClient } from 'classes/client';

// Slices an array into chunks of a given size and returns chunks
export function chunk<type>(arr: type[], size: number): type[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_: type, i: number) => arr.slice(i * size, i * size + size));
}

enum CustomIds {
  First = 'PAGINATION_FIRST',
  Previous = 'PAGINATION_PREV',
  Next = 'PAGINATION_NEXT',
  Last = 'PAGINATION_LAST',
}

export async function pagination({
  client,
  interaction,
  embeds,
  content,
  extraButton,
  extraButtonFunction,
  disableButtons = true,
  time = 60_000, // The time a user has to use the buttons before disabling them
  ephemeral = true, // If true, the pagination will only be visible to the user
  footer = true, // If true, will replace the current embeds footer to tell that the buttons have been disabled because the time is over
}: {
  client: DiscordClient;
  interaction: CommandInteraction;
  embeds: EmbedBuilder[];
  extraButton?: ButtonBuilder;
  extraButtonFunction?: (buttonInteraction: ButtonInteraction) => any;
  content?: string;
  time?: number;
  ephemeral?: boolean;
  footer?: boolean;
  disableButtons?: boolean;
}) {
  if (!interaction.deferred) await interaction.deferReply({ ephemeral });
  const { user } = interaction;
  const lng = await client.getUserLanguage(user.id);

  const buttonFirst = new ButtonBuilder().setCustomId(CustomIds.First).setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true);
  const buttonPrev = new ButtonBuilder().setCustomId(CustomIds.Previous).setStyle(ButtonStyle.Secondary).setEmoji('⬅️').setDisabled(true);
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

  const components = new ActionRowBuilder<ButtonBuilder>();
  if (extraButton) components.addComponents(extraButton);
  components.addComponents(buttonFirst, buttonPrev, buttonNext, buttonLast);

  let index = 0;
  const firstPageIndex = 0;
  const lastPageIndex = embeds.length - 1;

  const msg = await interaction.editReply({ content, embeds: [embeds[index]], components: [components] }).catch(() => {});
  if (!msg) return;

  const collector = msg.createMessageComponentCollector({ filter: (i) => i.user.id === user.id, idle: time, componentType: ComponentType.Button });

  collector.on('collect', async (int) => {
    await int.deferUpdate().catch(() => {});

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
      try {
        return await extraButtonFunction(int);
      } catch (e) {}
    }

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

    await int.editReply({ embeds: [embeds[index]], components: [components] }).catch(() => {});
  });

  collector.on('end', async (_, reason) => {
    if (reason === 'extra') return;
    if (!disableButtons) return;
    if (extraButton) extraButton.setDisabled(true);
    buttonFirst.setDisabled(true);
    buttonPrev.setDisabled(true);
    buttonNext.setDisabled(true);
    buttonLast.setDisabled(true);

    const embed = embeds[index];
    if (footer) embed.setFooter({ text: i18next.t('pagination', { lng, time: ms(time, { long: true }) }) });

    interaction.editReply({ embeds: [embed], components: [components] }).catch(() => {});
  });
}
