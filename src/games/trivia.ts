import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';

import type { DiscordClient } from 'classes/client';

export enum TriviaMode {
  SINGLE = 'boolean',
  MULTIPLE = 'multiple',
}

export enum TriviaDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export type TriviaQuestion = {
  type: TriviaMode;
  difficulty: TriviaDifficulty;
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

export class Trivia {
  trivia: TriviaQuestion;
  selected: string | null = null;
  answers: string[] = [];
  constructor(
    public options: {
      interaction: ChatInputCommandInteraction;
      client: DiscordClient;
      mode: TriviaMode;
      difficulty: TriviaDifficulty;
      category: number;
    }
  ) {
    this.trivia = {} as TriviaQuestion;

    this.start();
  }

  private async start() {
    const interaction = this.options.interaction;
    const user = interaction.user;
    const client = this.options.client;
    const lng = await client.getUserLanguage(user.id);

    const trivia = await this.getTrivia();
    if (!trivia) return interaction.editReply({ content: i18next.t('games.trivia.error', { lng }), embeds: [], components: [] }).catch(() => {});

    const message = await interaction
      .editReply({
        content: null,
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
            .setTitle(i18next.t('games.trivia.title', { lng }))
            .addFields(
              { name: i18next.t('games.trivia.category', { lng }), value: this.trivia.category },
              { name: i18next.t('games.trivia.difficulty', { lng }), value: this.trivia.difficulty },
              { name: i18next.t('games.trivia.question', { lng }), value: this.trivia.question }
            ),
        ],
        components: this.getComponents(),
      })
      .catch(() => {});
    if (!message) return;

    const collector = message.createMessageComponentCollector({ idle: 60 * 1000 });

    collector.on('collect', async (buttonInteraction) => {
      await buttonInteraction.deferUpdate().catch(() => {});

      if (buttonInteraction.user.id !== user.id)
        return buttonInteraction
          .followUp({
            content: i18next.t('interactions.author_only', { lng: await client.getUserLanguage(buttonInteraction.user.id) }),
            ephemeral: true,
          })
          .catch(() => {});

      collector.stop();
      this.selected = buttonInteraction.customId.split('_')[1];

      return this.getResult(lng, this.selected === this.trivia.correct_answer);
    });

    collector.on('end', (_, reason) => {
      if (reason === 'idle') return this.getResult(lng, false);
    });
  }

  private async getResult(lng: string, result: boolean) {
    const interaction = this.options.interaction;
    const user = interaction.user;

    return interaction
      .editReply({
        content: null,
        embeds: [
          new EmbedBuilder()
            .setColor(result ? Colors.Green : Colors.Red)
            .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
            .setTitle(i18next.t('games.trivia.title', { lng }))
            .setDescription(result ? i18next.t('games.trivia.correct', { lng }) : i18next.t('games.trivia.incorrect', { lng }))
            .addFields(
              { name: i18next.t('games.trivia.category', { lng }), value: this.trivia.category },
              { name: i18next.t('games.trivia.difficulty', { lng }), value: this.trivia.difficulty },
              { name: i18next.t('games.trivia.question', { lng }), value: this.trivia.question },
              { name: i18next.t('games.trivia.answer', { lng }), value: this.trivia.correct_answer },
              { name: i18next.t('games.trivia.input', { lng }), value: this.selected || '/' }
            ),
        ],
        components: this.disableButtons(this.getComponents()),
      })
      .catch(() => {});
  }

  private getComponents() {
    const row = new ActionRowBuilder<ButtonBuilder>();

    if (this.options.mode === TriviaMode.SINGLE) {
      const trueButton = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('TRIVIA_True').setLabel('✔️');
      const falseButton = new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('TRIVIA_False').setLabel('✖️');

      if (this.selected) {
        if (this.trivia.correct_answer === 'True') trueButton.setStyle(ButtonStyle.Success);
        else trueButton.setStyle(ButtonStyle.Danger);
        if (this.trivia.correct_answer === 'False') falseButton.setStyle(ButtonStyle.Success);
        else falseButton.setStyle(ButtonStyle.Danger);
      }

      row.addComponents(trueButton, falseButton);
    }

    if (this.options.mode === TriviaMode.MULTIPLE) {
      for (let i = 0; i < this.answers.length; i++) {
        const button = new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId(`TRIVIA_${this.answers[i]}`).setLabel(this.answers[i]);

        if (this.selected) {
          if (this.trivia.correct_answer !== this.answers[i]) button.setStyle(ButtonStyle.Danger);
          else button.setStyle(ButtonStyle.Success);
        }

        row.addComponents(button);
      }
    }

    return [row];
  }

  private async getTrivia() {
    const response = (await fetch(
      `https://opentdb.com/api.php?amount=1&type=${this.options.mode}&difficulty=${this.options.difficulty}&category=${this.options.category}`
    )
      .then(async (res) => await res.json())
      .then((res) => res.results[0])
      .catch(() => {})) as TriviaQuestion;
    if (!response) return false;

    response.incorrect_answers = response.incorrect_answers.map((ia) => this.decodeEntities(ia));
    response.correct_answer = this.decodeEntities(response.correct_answer);
    response.question = this.decodeEntities(response.question);

    this.answers = this.shuffleArray([response.correct_answer, ...response.incorrect_answers]);
    return (this.trivia = response);
  }

  private shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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

  private decodeEntities(encodedString: string) {
    const translateRegex = /&(nbsp|amp|quot|lt|gt);/g;
    const translate = {
      nbsp: ' ',
      amp: '&',
      quot: '"',
      lt: '<',
      gt: '>',
    };
    return encodedString
      .replace(translateRegex, (_match, entity) => translate[entity as keyof typeof translate])
      .replace(/&#(\d+);/gi, (_match, numStr) => {
        var num = parseInt(numStr, 10);
        return String.fromCharCode(num);
      });
  }
}
