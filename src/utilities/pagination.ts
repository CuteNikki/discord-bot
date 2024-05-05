import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, type CommandInteraction, type EmbedBuilder } from 'discord.js';

export function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_: T, i: number) => arr.slice(i * size, i * size + size));
}

export async function pagination({
  interaction,
  embeds, // The array of embeds (the pages)
  time = 180_000, // The time a user has to use the buttons before disabling them
  ephemeral = true, // If true, the pagination will only be visible to the user
  footer = true, // If true, will replace the current embeds footer to tell that the buttons have been disabled because the time is over
}: {
  interaction: CommandInteraction;
  embeds: EmbedBuilder[];
  time?: number;
  ephemeral?: boolean;
  footer?: boolean;
}) {
  if (!interaction.deferred) await interaction.deferReply({ ephemeral });

  enum CustomIds {
    FIRST = 'PAGINATION_FIRST',
    PREV = 'PAGINATION_PREV',
    NEXT = 'PAGINATION_NEXT',
    LAST = 'PAGINATION_LAST',
  }

  const buttonFirst = new ButtonBuilder().setCustomId(CustomIds.FIRST).setStyle(ButtonStyle.Secondary).setEmoji('⏪').setDisabled(true);
  const buttonPrev = new ButtonBuilder().setCustomId(CustomIds.PREV).setStyle(ButtonStyle.Secondary).setEmoji('⬅️').setDisabled(true);
  const buttonNext = new ButtonBuilder().setCustomId(CustomIds.NEXT).setStyle(ButtonStyle.Secondary).setEmoji('➡️');
  const buttonLast = new ButtonBuilder().setCustomId(CustomIds.LAST).setStyle(ButtonStyle.Secondary).setEmoji('⏩');

  if (embeds.length === 1) {
    buttonNext.setDisabled(true);
    buttonLast.setDisabled(true);
  }

  const components = new ActionRowBuilder<ButtonBuilder>().setComponents(buttonFirst, buttonPrev, buttonNext, buttonLast);

  let index = 0;
  const firstPageIndex = 0;
  const lastPageIndex = embeds.length - 1;

  const msg = await interaction.editReply({ embeds: [embeds[index]], components: [components] });

  const collector = msg.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, idle: time, componentType: ComponentType.Button });

  collector.on('collect', async (int) => {
    await int.deferUpdate();

    if (int.customId === CustomIds.FIRST) {
      if (index > firstPageIndex) index = firstPageIndex;
    } else if (int.customId === CustomIds.PREV) {
      if (index > firstPageIndex) index--;
    } else if (int.customId === CustomIds.NEXT) {
      if (index < lastPageIndex) index++;
    } else if (int.customId === CustomIds.LAST) {
      if (index < lastPageIndex) index = lastPageIndex;
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

    await int.editReply({ embeds: [embeds[index]], components: [components] });
  });

  collector.on('end', () => {
    buttonFirst.setDisabled(true);
    buttonPrev.setDisabled(true);
    buttonNext.setDisabled(true);
    buttonLast.setDisabled(true);

    const embed = embeds[index];
    if (footer) embed.setFooter({ text: 'The time to use buttons has run out' });

    interaction.editReply({ embeds: [embed], components: [components] }).catch(() => {});
  });
}
