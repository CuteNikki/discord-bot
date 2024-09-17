import { Colors, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { t } from 'i18next';

import type { DiscordClient } from 'classes/client';

import { getUserLanguage } from 'db/user';

import { logger } from 'utils/logger';

export class FastType {
  timeTaken: number = 0;
  wordsPerMinute: number = 0;
  sentence: string;
  constructor(
    public options: {
      interaction: ChatInputCommandInteraction;
      client: DiscordClient;
    },
  ) {
    this.sentence = this.getRandomSentence();

    this.start();
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
            .setTitle(t('games.typing.title', { lng }))
            .addFields(
              {
                name: t('games.typing.info', { lng }), // Info
                value: t('games.typing.timer', { lng }), // You have 60 seconds to type the sentence below
              },
              {
                name: t('games.typing.sentence', { lng }),
                value: this.sentence
                  .split(' ')
                  .map((word) => `\`${word}\``)
                  .join('⠀'), // <- invisible character to stop people from copying the sentence and pasting it
              },
            ),
        ],
        components: [],
      })
      .catch((err) => logger.debug({ err }, 'Could not send message'));

    if (!message || !interaction.channel?.isSendable()) return;

    const startTime = Date.now();

    const collector = interaction.channel?.createMessageCollector({
      time: 60 * 1000,
      filter: (msg) => msg.author.id === user.id,
    });
    if (!collector) return;

    collector.on('collect', async (msg) => {
      collector.stop();
      this.timeTaken = Math.floor(Date.now() - startTime);
      this.wordsPerMinute = Math.floor(msg.content.trim().length / ((this.timeTaken / 60000) % 60) / 5);

      return await this.getResult(lng, msg.content.trim());
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        return await this.getResult(lng, '/');
      }
    });
  }

  private async getResult(lng: string, userSentence: string) {
    const interaction = this.options.interaction;
    const user = interaction.user;

    const isSentenceCorrect = userSentence.trim() === this.sentence;

    return await interaction.editReply({
      content: null,
      embeds: [
        new EmbedBuilder()
          .setColor(isSentenceCorrect ? Colors.Green : Colors.Yellow)
          .setAuthor({
            name: user.displayName,
            iconURL: user.displayAvatarURL(),
          })
          .setTitle(t('games.typing.title', { lng }))
          .addFields(
            {
              name: t('games.typing.sentence', { lng }),
              value: this.sentence,
            },
            {
              name: t('games.typing.input', { lng }),
              value: userSentence,
            },
            {
              name: t('games.typing.similarity', { lng }),
              value: isSentenceCorrect ? '100%' : `${Math.floor(this.stringSimilarity(this.sentence, userSentence, 2, true) * 100)}%`,
            },
            {
              name: t('games.typing.wpm', { lng }),
              value: `${this.wordsPerMinute}`,
            },
            {
              name: t('games.typing.time', { lng }),
              value: `${Math.floor(this.timeTaken / 1000)}s`,
            },
          ),
      ],
      components: [],
    });
  }

  private stringSimilarity(stringOne: string, stringTwo: string, substringLength: number = 2, isCaseSensitive: boolean = false) {
    if (!isCaseSensitive) {
      stringOne = stringOne.toLowerCase();
      stringTwo = stringTwo.toLowerCase();
    }

    if (stringOne.length < substringLength || stringTwo.length < substringLength) return 0;

    const map = new Map();
    for (let i = 0; i < stringOne.length - (substringLength - 1); i++) {
      const substringOne = stringOne.substring(i, substringLength);
      map.set(substringOne, map.has(substringOne) ? map.get(substringOne) + 1 : 1);
    }

    let match = 0;
    for (let j = 0; j < stringTwo.length - (substringLength - 1); j++) {
      const substringTwo = stringTwo.substring(j, substringLength);
      const count = map.has(substringTwo) ? map.get(substringTwo) : 0;
      if (count > 0) {
        map.set(substringTwo, count - 1);
        match++;
      }
    }

    return (match * 2) / (stringOne.length + stringTwo.length - (substringLength - 1) * 2);
  }

  private getRandomSentence() {
    const sentences = [
      'The quick brown fox jumps over the lazy dog.',
      'A journey of a thousand miles begins with a single step.',
      'The sun sets in the west, painting the sky in hues of orange and pink.',
      'Success is not final, failure is not fatal: It is the courage to continue that counts.',
      'Be the change that you wish to see in the world.',
      'The only constant in life is change.',
      'All our dreams can come true if we have the courage to pursue them.',
      'To be yourself in a world that is constantly trying to make you something else is a great accomplishment.',
      "Believe you can and you're halfway there.",
      'The only way to do great work is to love what you do.',
      'Strive not to be a success, but rather to be of value.',
      "Don't count the days, make the days count.",
      'The only limit to our realization of tomorrow will be our doubts of today.',
      "Dream as if you'll live forever, live as if you'll die today.",
      "You miss 100% of the shots you don't take.",
      'The future belongs to those who believe in the beauty of their dreams.',
      'Life is either a daring adventure or nothing at all.',
      'The only way to have a friend is to be one.',
      'Life is really simple, but we insist on making it complicated.',
      'The greatest pleasure in life is doing what people say you cannot do.',
      'The best way to predict the future is to create it.',
      'Some really cool sentence to fast type.',
    ];
    return sentences[Math.floor(Math.random() * sentences.length)];
  }
}
