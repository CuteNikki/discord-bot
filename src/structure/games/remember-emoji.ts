import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { t } from 'i18next';

import type { DiscordClient } from 'classes/client';

export class RememberEmoji {
  styles: string[][] = [
    ['🍉', '🍇', '🍊', '🍋', '🥭', '🍎', '🍏', '🥝'],
    ['➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️'],
    ['🐘', '🐄', '🐕', '🐖', '🐢', '🐍', '🐐', '🐇', '🐈'],
  ];
  emojis: string[];
  emoji: string;
  selected?: string;
  constructor(public options: { interaction: ChatInputCommandInteraction; client: DiscordClient }) {
    this.emojis = this.shuffleArray(this.styles[Math.floor(Math.random() * this.styles.length)]);
    this.emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];

    this.start();
  }

  private async start() {
    const interaction = this.options.interaction;
    const user = interaction.user;
    const client = this.options.client;
    const lng = await client.getUserLanguage(user.id);

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
      .setTitle(t('games.remember.title', { lng }))
      .setDescription(t('games.remember.starting', { lng }));

    const message = await interaction
      .editReply({
        content: null,
        embeds: [embed],
        components: this.getComponents(true),
      })
      .catch(() => {});
    if (!message) return;

    setTimeout(async () => {
      embed.setDescription(t('games.remember.started', { lng, emoji: this.emoji }));
      await interaction.editReply({ embeds: [embed], components: this.getComponents(false) });

      const collector = message.createMessageComponentCollector({ idle: 60 * 1000 });

      collector.on('collect', async (buttonInteraction) => {
        await buttonInteraction.deferUpdate().catch(() => {});

        if (buttonInteraction.user.id !== user.id)
          return buttonInteraction
            .followUp({
              content: t('interactions.author_only', { lng: await client.getUserLanguage(buttonInteraction.user.id) }),
              ephemeral: true,
            })
            .catch(() => {});

        this.selected = this.emojis[parseInt(buttonInteraction.customId.split('_')[1])];
        return collector.stop();
      });

      collector.on('end', async (_, reason) => {
        return await this.getResult(lng, reason);
      });
    }, 5 * 1000);
  }

  private async getResult(lng: string, reason: string) {
    const interaction = this.options.interaction;
    const user = interaction.user;

    let result: 'WIN' | 'LOOSE' | 'TIMEOUT' | null;

    if (this.selected === this.emoji) result = 'WIN';
    else result = 'LOOSE';
    if (reason === 'idle') result = 'TIMEOUT';

    return await interaction.editReply({
      content: null,
      embeds: [
        new EmbedBuilder()
          .setColor(result === 'WIN' ? Colors.Green : Colors.Red)
          .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
          .setTitle(t('games.remember.title', { lng }))
          .setDescription(
            result === 'WIN'
              ? t('games.remember.correct', { lng })
              : result === 'TIMEOUT'
              ? t('games.remember.timeout', { lng })
              : t('games.remember.incorrect', { lng })
          )
          .addFields(
            { name: t('games.remember.answer', { lng }), value: this.emoji },
            { name: t('games.remember.input', { lng }), value: this.selected || '/' }
          ),
      ],
      components: this.disableButtons(this.getComponents(true)),
    });
  }

  private getComponents(showEmojis: boolean) {
    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    for (let y = 0; y < 2; y++) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      for (let x = 0; x < 4; x++) {
        const emoji = this.emojis[y * 4 + x];

        const button = new ButtonBuilder().setCustomId(`REMEMBER_${y * 4 + x}`).setStyle(ButtonStyle.Secondary);
        if (this.selected) button.setStyle(this.emoji === emoji ? ButtonStyle.Success : ButtonStyle.Danger);

        if (showEmojis) button.setEmoji(emoji);
        else button.setLabel('\u200b');

        row.addComponents(button);
      }
      components.push(row);
    }
    return components;
  }

  private disableButtons(components: ActionRowBuilder<ButtonBuilder>[]) {
    for (let x = 0; x < components.length; x++) {
      for (let y = 0; y < components[x].components.length; y++) {
        components[x].components[y] = ButtonBuilder.from(components[x].components[y]);
        components[x].components[y].setDisabled(true);
      }
    }
    return components;
  }

  private shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
