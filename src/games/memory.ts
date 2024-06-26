import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  type APIButtonComponent,
  type ButtonComponentData,
  type ChatInputCommandInteraction,
} from 'discord.js';
import i18next from 'i18next';

import type { DiscordClient } from 'classes/client';

type EmojiCoordinates = {
  x: number;
  y: number;
  id: number;
};

export class Memory {
  availableEmojis: string[] = ['🍉', '🍇', '🍊', '🍋', '🥭', '🍎', '🍏', '🥝', '🥥', '🍓', '🍒', '🫐', '🍍', '🍅', '🍐', '🥔', '🌽', '🥕', '🥬', '🥦'];
  emojis: string[];
  tilesTurned: number = 0;
  remainingPairs: number = 12;
  selected?: EmojiCoordinates;
  components: ActionRowBuilder<CustomButtonBuilder>[];
  size: number = 5; // max size is 5x5
  constructor(
    public options: {
      interaction: ChatInputCommandInteraction;
      client: DiscordClient;
    }
  ) {
    this.emojis = this.shuffleArray(this.availableEmojis).slice(0, 12);
    this.emojis.push(...this.emojis, '🃏');
    this.emojis = this.shuffleArray(this.emojis);

    this.components = this.getComponents();

    this.start();
  }

  private async start() {
    const interaction = this.options.interaction;
    const user = interaction.user;
    const client = this.options.client;
    const lng = await client.getLanguage(user.id);

    const message = await interaction
      .editReply({
        content: null,
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
            .setTitle(i18next.t('games.memory.title', { lng }))
            .setDescription(i18next.t('games.memory.description', { lng })),
        ],
        components: this.components,
      })
      .catch(() => {});
    if (!message) return;

    const collector = message.createMessageComponentCollector({ idle: 60 * 1000 });

    collector.on('collect', async (buttonInteraction) => {
      await buttonInteraction.deferUpdate().catch(() => {});

      if (buttonInteraction.user.id !== user.id)
        return buttonInteraction
          .followUp({
            content: i18next.t('interactions.author_only', { lng: await client.getLanguage(buttonInteraction.user.id) }),
            ephemeral: true,
          })
          .catch(() => {});

      const x = parseInt(buttonInteraction.customId.split('_')[1]);
      const y = parseInt(buttonInteraction.customId.split('_')[2]);
      const id = y * this.size + x;

      const emoji = this.emojis[id];
      const emojiButton = this.components[y].components[x];
      this.tilesTurned += 1;

      if (!this.selected) {
        this.selected = { x, y, id };
        emojiButton.setEmoji(emoji).setStyle(ButtonStyle.Primary).removeLabel();
      } else if (this.selected.id === id) {
        this.selected = undefined;
        emojiButton.removeEmoji().setStyle(ButtonStyle.Secondary).setLabel('\u200b');
      } else {
        const selectedEmoji = this.emojis[this.selected.id];
        const selectedButton = this.components[this.selected.y].components[this.selected.x];
        const matched = emoji === selectedEmoji || selectedEmoji === '🃏' || emoji === '🃏';

        if (selectedEmoji === '🃏' || emoji === '🃏') {
          const joker = emoji === '🃏' ? this.selected : { x, y, id };
          const pair = this.getPair(this.emojis[joker.id]).filter((b) => b.id !== joker.id)[0];
          const pairButton = this.components[pair.y].components[pair.x];
          pairButton.setEmoji(this.emojis[pair.id]).setStyle(ButtonStyle.Success).setDisabled(true).removeLabel();
        }

        emojiButton
          .setEmoji(emoji)
          .setStyle(matched ? ButtonStyle.Success : ButtonStyle.Danger)
          .setDisabled(matched)
          .removeLabel();
        selectedButton
          .setEmoji(selectedEmoji)
          .setStyle(matched ? ButtonStyle.Success : ButtonStyle.Danger)
          .setDisabled(matched)
          .removeLabel();

        if (!matched) {
          await buttonInteraction.editReply({ components: this.components }).catch(() => {});

          emojiButton.removeEmoji().setStyle(ButtonStyle.Secondary).setLabel('\u200b');
          selectedButton.removeEmoji().setStyle(ButtonStyle.Secondary).setLabel('\u200b');

          this.selected = undefined;

          return;
        }

        this.remainingPairs -= 1;
        this.selected = undefined;
      }

      if (this.remainingPairs === 0) return collector.stop();
      return await buttonInteraction.editReply({ components: this.components }).catch(() => {});
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'idle') {
        return await this.getResult(lng, false);
      } else if (reason === 'user') {
        return await this.getResult(lng, true);
      }
    });
  }

  private async getResult(lng: string, isDone: boolean) {
    const interaction = this.options.interaction;
    const user = interaction.user;

    return await interaction
      .editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(isDone ? Colors.Green : Colors.Red)
            .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
            .setTitle(i18next.t('games.memory.title', { lng }))
            .setDescription(i18next.t('games.memory.finished', { lng, tiles: this.tilesTurned })),
        ],
        components: this.disableButtons(this.components),
      })
      .catch(() => {});
  }

  private getPair(emoji: string) {
    const emojis: EmojiCoordinates[] = [];

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const id = y * this.size + x;
        if (this.emojis[id] === emoji) emojis.push({ x, y, id });
      }
    }

    return emojis;
  }

  private getComponents() {
    const components: ActionRowBuilder<CustomButtonBuilder>[] = [];

    for (let y = 0; y < this.size; y++) {
      const row = new ActionRowBuilder<CustomButtonBuilder>();
      for (let x = 0; x < this.size; x++) {
        row.addComponents(new CustomButtonBuilder().setStyle(ButtonStyle.Secondary).setLabel('\u200b').setCustomId(`MEMORY_${x}_${y}`));
      }
      components.push(row);
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

  private disableButtons(components: ActionRowBuilder<ButtonBuilder | CustomButtonBuilder>[]) {
    for (let x = 0; x < components.length; x++) {
      for (let y = 0; y < components[x].components.length; y++) {
        components[x].components[y] = ButtonBuilder.from(components[x].components[y]);
        components[x].components[y].setDisabled(true);
      }
    }
    return components;
  }
}

class CustomButtonBuilder extends ButtonBuilder {
  constructor(data?: Partial<ButtonComponentData> | Partial<APIButtonComponent>) {
    super(data);
  }

  removeLabel() {
    this.data.label = undefined;
    return this;
  }

  removeEmoji() {
    this.data.emoji = undefined;
    return this;
  }
}
