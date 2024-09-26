import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { t } from 'i18next';

import type { DiscordClient } from 'classes/client';

import { getUserLanguage } from 'db/user';

import { WORDS } from 'constants/words';
import { logger } from 'utils/logger';

export class Hangman {
  emojiLetters = {
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
  damage: number = 0;
  word: string;
  guesses: string[] = [];
  buttonPage: number = 0;
  constructor(
    public options: {
      interaction: ChatInputCommandInteraction;
      client: DiscordClient;
      theme: keyof typeof WORDS;
    },
  ) {
    const wordsFromTheme = WORDS[this.options.theme];
    this.word = wordsFromTheme[Math.floor(Math.random() * wordsFromTheme.length)];

    this.start();
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

  private async start() {
    const interaction = this.options.interaction;
    const user = interaction.user;
    const lng = await getUserLanguage(user.id);

    const message = await interaction
      .editReply({
        content: null,
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setAuthor({
              name: user.displayName,
              iconURL: user.displayAvatarURL(),
            })
            .setTitle(t('games.hangman.title', { lng }))
            .setDescription(this.getBoardContent())
            .addFields(
              {
                name: t('games.hangman.theme', { lng }),
                value: this.options.theme,
              },
              {
                name: t('games.hangman.word', {
                  lng,
                  length: this.word.length,
                }),
                value: this.getCensoredWord(),
              },
            ),
        ],
        components: this.getComponents(),
      })
      .catch((err) => logger.debug({ err }, 'Could not send message'));
    if (!message) return;

    const collector = message.createMessageComponentCollector({
      idle: 60 * 1000,
    });

    collector.on('collect', async (buttonInteraction) => {
      await buttonInteraction.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));

      if (buttonInteraction.user.id !== user.id)
        return buttonInteraction.followUp({
          content: t('interactions.author_only', {
            lng: await getUserLanguage(buttonInteraction.user.id),
          }),
          ephemeral: true,
        });
      const guess = buttonInteraction.customId.split('_')[1];

      if (guess === 'stop') return collector.stop();
      if (parseInt(guess) === 0 || parseInt(guess) === 1) {
        return interaction.editReply({ components: this.getComponents(parseInt(guess)) }).catch((err) => logger.debug({ err }, 'Could not edit message'));
      }
      if (!this.guesses.includes(guess)) {
        this.guesses.push(guess);
        if (!this.word.includes(guess.toLowerCase())) this.damage += 1;

        await buttonInteraction
          .editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.Yellow)
                .setAuthor({
                  name: user.displayName,
                  iconURL: user.displayAvatarURL(),
                })
                .setTitle(t('games.hangman.title', { lng }))
                .setDescription(this.getBoardContent())
                .addFields(
                  {
                    name: t('games.hangman.theme', { lng }),
                    value: this.options.theme,
                  },
                  {
                    name: t('games.hangman.word', {
                      lng,
                      length: this.word.length,
                    }),
                    value: this.getCensoredWord(),
                  },
                  {
                    name: t('games.hangman.guesses', { lng }),
                    value: this.guesses.map((letter) => `\`${letter}\``).join(', ') || '/',
                  },
                ),
            ],
            components: this.getComponents(this.buttonPage),
          })
          .catch((err) => logger.debug({ err }, 'Could not edit message'));

        if (this.damage > 4 || this.isGuessCorrect()) return collector.stop();
      }
    });

    collector.on('end', async (_, reason) => {
      return await this.getResult(lng, reason);
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

  private async getResult(lng: string, reason: string) {
    const interaction = this.options.interaction;
    const user = interaction.user;

    let result: 'TIMEOUT' | 'WIN' | 'LOSE' | null = null;

    if (reason === 'idle') result = 'TIMEOUT';
    else if (this.isGuessCorrect()) result = 'WIN';
    else result = 'LOSE';

    const embed = new EmbedBuilder()
      .setColor(result === 'TIMEOUT' ? Colors.Yellow : result === 'WIN' ? Colors.Green : Colors.Red)
      .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() })
      .setTitle(t('games.hangman.title', { lng }))
      .addFields(
        { name: t('games.hangman.theme', { lng }), value: this.options.theme },
        {
          name: t('games.hangman.word', { lng, length: this.word.length }),
          value: this.getCensoredWord(),
        },
        {
          name: t('games.hangman.guesses', { lng }),
          value: this.guesses.map((letter) => `\`${letter}\``).join(', ') || '/',
        },
      );

    if (result === 'TIMEOUT') embed.setDescription([t('games.hangman.timeout', { lng, word: this.word }), this.getBoardContent()].join('\n\n'));
    else if (result === 'LOSE') embed.setDescription([t('games.hangman.lost', { lng, word: this.word }), this.getBoardContent()].join('\n\n'));
    else embed.setDescription([t('games.hangman.won', { lng }), this.getBoardContent()].join('\n\n'));

    return await interaction.editReply({ content: null, embeds: [embed], components: [] }).catch((err) => logger.debug({ err }, 'Could not edit message'));
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
    if (page == 0) return Object.keys(this.emojiLetters).slice(0, 12);
    else return Object.keys(this.emojiLetters).slice(12, 24);
  }

  private letterToEmoji(letter: string) {
    if (!Object.keys(this.emojiLetters).includes(letter)) return '?';
    return this.emojiLetters[letter as keyof typeof this.emojiLetters];
  }
}
