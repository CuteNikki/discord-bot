import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, Message, type ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';

import type { DiscordClient } from 'classes/client';

import { words } from 'utils/words';

const emojiLetters = {
  A: '🇦',
  B: '🇧',
  C: '🇨',
  D: '🇩',
  E: '🇪',
  F: '🇫',
  G: '🇬',
  H: '🇭',
  I: '🇮',
  J: '🇯',
  K: '🇰',
  L: '🇱',
  M: '🇲',
  N: '🇳',
  O: '🇴',
  P: '🇵',
  Q: '🇶',
  R: '🇷',
  S: '🇸',
  T: '🇹',
  U: '🇺',
  V: '🇻',
  W: '🇼',
  X: '🇽',
  Y: '🇾',
  Z: '🇿',
};

export class Hangman {
  damage: number = 0;
  word: string;
  guesses: string[] = [];
  buttonPage: number = 0;
  constructor(
    public options: {
      interaction: ChatInputCommandInteraction;
      client: DiscordClient;
      theme: keyof typeof words;
    }
  ) {
    const wordsFromTheme = words[this.options.theme];
    this.word = wordsFromTheme[Math.floor(Math.random() * wordsFromTheme.length)];
  }

  private getBoardContent() {
    return [
      '```',
      '|‾‾‾‾‾‾‾|',
      `|      ${this.damage > 0 ? '🎩' : ' '}`,
      `|      ${this.damage > 1 ? '😟' : ' '}`,
      `|      ${this.damage > 2 ? '👕' : ' '}`,
      `|      ${this.damage > 3 ? '👖' : ' '}`,
      `|      ${this.damage > 4 ? '👞👞' : ' '}`,
      '|___________',
      '```',
    ].join('\n');
  }

  async start() {
    const user = this.options.interaction.user;
    const lng = await this.options.client.getLanguage(user.id);

    const message = await this.options.interaction
      .editReply({
        content: null,
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
            .setTitle(i18next.t('games.hangman.title', { lng }))
            .setDescription(this.getBoardContent())
            .addFields(
              { name: i18next.t('games.hangman.theme', { lng }), value: this.options.theme },
              { name: i18next.t('games.hangman.word', { lng, length: this.word.length }), value: this.getCensoredWord() }
            ),
        ],
        components: this.getComponents(),
      })
      .catch(() => {});
    if (!message) return;

    const collector = message.createMessageComponentCollector({ idle: 60 * 1000 });

    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.user.id !== user.id)
        return buttonInteraction.reply({
          content: i18next.t('interactions.author_only', { lng: await this.options.client.getLanguage(buttonInteraction.user.id) }),
        });

      await buttonInteraction.deferUpdate().catch(() => {});
      const guess = buttonInteraction.customId.split('_')[1];

      if (guess === 'stop') return collector.stop();
      if (parseInt(guess) === 0 || parseInt(guess) === 1) {
        return message.edit({ components: this.getComponents(parseInt(guess)) }).catch(() => {});
      }
      if (!this.guesses.includes(guess)) {
        this.guesses.push(guess);
        if (!this.word.includes(guess.toLowerCase())) this.damage += 1;

        message
          .edit({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.Yellow)
                .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
                .setTitle(i18next.t('games.hangman.title', { lng }))
                .setDescription(this.getBoardContent())
                .addFields(
                  { name: i18next.t('games.hangman.theme', { lng }), value: this.options.theme },
                  { name: i18next.t('games.hangman.word', { lng, length: this.word.length }), value: this.getCensoredWord() },
                  { name: i18next.t('games.hangman.guesses', { lng }), value: this.guesses.map((letter) => `\`${letter}\``).join(', ') || '/' }
                ),
            ],
            components: this.getComponents(this.buttonPage),
          })
          .catch(() => {});

        if (this.damage > 4 || this.isGuessCorrect()) return collector.stop();
      }
    });

    collector.on('end', async (_, reason) => {
      this.getResult(message, lng, reason);
    });
  }

  private isGuessCorrect() {
    return this.word
      .toUpperCase()
      .replaceAll(' ', '')
      .split('')
      .every((letter) => this.guesses.includes(letter));
  }

  private getCensoredWord(): string {
    return this.word
      .toUpperCase()
      .split('')
      .map((letter) => (this.guesses.includes(letter) ? this.letterToEmoji(letter) : letter === ' ' ? ' ' : '🔵'))
      .join(' ');
  }

  private async getResult(message: Message, lng: string, reason: string) {
    const user = this.options.interaction.user;

    let result: 'TIMEOUT' | 'WIN' | 'LOSE' | 'STOP' | null = null;

    if (reason === 'idle') result = 'TIMEOUT';
    else if (reason === 'user' && !this.isGuessCorrect()) result = 'STOP';
    else if (this.isGuessCorrect()) result = 'WIN';
    else result = 'LOSE';

    const embed = new EmbedBuilder()
      .setColor(result === 'TIMEOUT' ? Colors.Yellow : result === 'WIN' ? Colors.Green : Colors.Red)
      .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
      .setTitle(i18next.t('games.hangman.title', { lng }))
      .addFields(
        { name: i18next.t('games.hangman.theme', { lng }), value: this.options.theme },
        { name: i18next.t('games.hangman.word', { lng, length: this.word.length }), value: this.getCensoredWord() },
        { name: i18next.t('games.hangman.guesses', { lng }), value: this.guesses.map((letter) => `\`${letter}\``).join(', ') || '/' }
      );

    if (result === 'TIMEOUT') embed.setDescription([i18next.t('games.hangman.timeout', { lng, word: this.word }), this.getBoardContent()].join('\n\n'));
    else if (result === 'LOSE') embed.setDescription([i18next.t('games.hangman.lost', { lng, word: this.word }), this.getBoardContent()].join('\n\n'));
    else if (result === 'STOP') embed.setDescription([i18next.t('games.hangman.stop', { lng, word: this.word }), this.getBoardContent()].join('\n\n'));
    else embed.setDescription([i18next.t('games.hangman.won', { lng }), this.getBoardContent()].join('\n\n'));

    return message.edit({ content: null, embeds: [embed], components: [] }).catch(() => {});
  }

  private getComponents(page = 0) {
    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    if (this.buttonPage !== page) this.buttonPage = page;

    const letters = this.getLettersForPage(this.buttonPage);

    for (let y = 0; y < 3; y++) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      for (let x = 0; x < 4; x++) {
        const letter = letters[y * 4 + x];
        const button = new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setLabel(letter)
          .setCustomId(`HANGMAN_${letter}`)
          .setDisabled(this.guesses.includes(letter));

        row.addComponents(button);
      }
      components.push(row);
    }

    const extraRow = new ActionRowBuilder<ButtonBuilder>();

    const stopButton = new ButtonBuilder().setStyle(ButtonStyle.Danger).setEmoji('✖️').setCustomId('HANGMAN_stop');
    const pageButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Success)
      .setEmoji(this.buttonPage === 1 ? '⬅️' : '➡️')
      .setCustomId(`HANGMAN_${this.buttonPage === 1 ? '0' : '1'}`);
    const letterY = new ButtonBuilder().setStyle(ButtonStyle.Primary).setLabel('Y').setCustomId('HANGMAN_Y').setDisabled(this.guesses.includes('Y'));
    const letterZ = new ButtonBuilder().setStyle(ButtonStyle.Primary).setLabel('Z').setCustomId('HANGMAN_Z').setDisabled(this.guesses.includes('Z'));

    extraRow.addComponents(pageButton, stopButton);
    if (this.buttonPage === 1) extraRow.addComponents(letterY, letterZ);

    components.push(extraRow);

    return components;
  }

  private getLettersForPage(page: number) {
    if (page == 0) return Object.keys(emojiLetters).slice(0, 12);
    else return Object.keys(emojiLetters).slice(12, 24);
  }

  private letterToEmoji(letter: string) {
    if (!Object.keys(emojiLetters).includes(letter)) return '?';
    return emojiLetters[letter as keyof typeof emojiLetters];
  }
}
