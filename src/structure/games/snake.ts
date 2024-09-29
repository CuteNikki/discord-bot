import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { t } from 'i18next';

import type { DiscordClient } from 'classes/client';

import { getUserLanguage } from 'db/user';

import { logger } from 'utils/logger';

type Coordinates = {
  x: number;
  y: number;
};

export class Snake {
  snakeEmojis = {
    dead: '💀',
    head: '🔵',
    body: '🟦',
    tail: '🔷'
  };
  boardEmojis = {
    tile: '⬛',
    food: '🍎'
  };
  height: number;
  width: number;
  board: string[] = [];
  snake: Coordinates[] = [{ x: 1, y: 1 }];
  snakeLength: number = 1;
  score: number = 0;
  food: Coordinates = { x: 1, y: 1 };
  constructor(
    public options: {
      interaction: ChatInputCommandInteraction;
      client: DiscordClient;
      size: { width: number; height: number };
    }
  ) {
    this.height = options.size.height;
    this.width = options.size.width;
    this.snake[0].x = Math.ceil(options.size.width / 2);
    this.snake[0].y = Math.ceil(options.size.height / 2);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.board[y * this.width + x] = this.boardEmojis.tile;
      }
    }

    this.start();
  }

  private getBoardContent(isDead?: boolean) {
    let board = '';

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (x === this.food.x && y === this.food.y) {
          board += this.boardEmojis.food;
          continue;
        }

        const snake = this.isSnake({ x, y });

        if (snake) {
          const snakePart = this.snake.indexOf(snake);
          if (snakePart === 0) {
            const isHead = !isDead || this.snakeLength >= this.height * this.width;
            board += isHead ? this.snakeEmojis.head : this.snakeEmojis.dead;
          } else if (snakePart === this.snake.length - 1) {
            board += this.snakeEmojis.tail;
          } else {
            board += this.snakeEmojis.body;
          }
        }
        if (!snake) board += this.board[y * this.width + x];
      }

      board += '\n';
    }

    return board;
  }

  private async start() {
    const interaction = this.options.interaction;
    const user = interaction.user;
    const lng = await getUserLanguage(user.id);

    this.generateNewFood();

    const message = await interaction
      .editReply({
        content: null,
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setAuthor({
              name: user.displayName,
              iconURL: user.displayAvatarURL()
            })
            .setTitle(t('games.snake.title', { lng }))
            .setDescription(this.getBoardContent())
            .addFields({
              name: t('games.snake.score', { lng }),
              value: `${this.score}`
            })
        ],
        components: this.getComponents()
      })
      .catch((err) => logger.debug({ err }, 'Could not send message'));
    if (!message) return;

    const collector = message.createMessageComponentCollector({
      idle: 60 * 1000
    });

    collector.on('collect', async (buttonInteraction) => {
      await buttonInteraction.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));

      if (buttonInteraction.user.id !== user.id)
        return buttonInteraction
          .followUp({
            content: t('interactions.author_only', {
              lng: await getUserLanguage(buttonInteraction.user.id)
            }),
            ephemeral: true
          })
          .catch((err) => logger.debug({ err }, 'Could not follow up'));

      const snakeHead = this.snake[0];
      const nextCoordinates = { x: snakeHead.x, y: snakeHead.y };

      const move = buttonInteraction.customId.split('_')[1];

      if (move === 'left') nextCoordinates.x = snakeHead.x - 1;
      else if (move === 'right') nextCoordinates.x = snakeHead.x + 1;
      else if (move === 'down') nextCoordinates.y = snakeHead.y + 1;
      else if (move === 'up') nextCoordinates.y = snakeHead.y - 1;

      if (nextCoordinates.x < 0 || nextCoordinates.x >= this.width) {
        nextCoordinates.x = nextCoordinates.x < 0 ? 0 : this.width - 1;
        return collector.stop();
      }
      if (nextCoordinates.y < 0 || nextCoordinates.y >= this.height) {
        nextCoordinates.y = nextCoordinates.y < 0 ? 0 : this.height - 1;
        return collector.stop();
      }

      if (this.isSnake(nextCoordinates) || move === 'stop') return collector.stop();

      this.snake.unshift(nextCoordinates);
      if (this.snake.length > this.snakeLength) this.snake.pop();

      if (this.food.x === this.snake[0].x && this.food.y === this.snake[0].y) {
        this.score += 1;
        this.snakeLength += 1;
        this.generateNewFood();
      }

      return await buttonInteraction
        .editReply({
          content: null,
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Yellow)
              .setAuthor({
                name: user.displayName,
                iconURL: user.displayAvatarURL()
              })
              .setTitle(t('games.snake.title', { lng }))
              .setDescription(this.getBoardContent())
              .addFields({
                name: t('games.snake.score', { lng }),
                value: `${this.score}`
              })
          ]
        })
        .catch((err) => logger.debug({ err }, 'Could not edit message'));
    });

    collector.on('end', async () => {
      return await this.getResult(lng);
    });
  }

  private async getResult(lng: string) {
    const interaction = this.options.interaction;
    const user = interaction.user;

    return await interaction
      .editReply({
        content: null,
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setAuthor({
              name: user.displayName,
              iconURL: user.displayAvatarURL()
            })
            .setTitle(t('games.snake.title', { lng }))
            .setDescription([t('games.snake.over', { lng }), this.getBoardContent(true)].join('\n\n'))
            .addFields({
              name: t('games.snake.score', { lng }),
              value: `${this.score}`
            })
        ],
        components: this.disableButtons(this.getComponents())
      })
      .catch((err) => logger.debug({ err }, 'Could not edit message'));
  }

  private isSnake(coordinates: Coordinates) {
    return this.snake.find((snake) => snake.x === coordinates.x && snake.y === coordinates.y);
  }

  private generateNewFood() {
    let foodPosition = { x: 0, y: 0 };

    do {
      foodPosition = {
        x: parseInt((Math.random() * this.width).toString()),
        y: parseInt((Math.random() * this.height).toString())
      };
    } while (this.isSnake(foodPosition));

    this.food = foodPosition;
  }

  private getComponents() {
    const disabledOneButton = new ButtonBuilder().setCustomId('SNAKE_DISABLED_ONE').setDisabled(true).setStyle(ButtonStyle.Secondary).setLabel('\u200b');
    const disabledTwoButton = new ButtonBuilder().setCustomId('SNAKE_DISABLED_TWO').setDisabled(true).setStyle(ButtonStyle.Secondary).setLabel('\u200b');
    const upButton = new ButtonBuilder().setCustomId('SNAKE_up').setStyle(ButtonStyle.Primary).setEmoji('⬆️');
    const leftButton = new ButtonBuilder().setCustomId('SNAKE_left').setStyle(ButtonStyle.Primary).setEmoji('⬅️');
    const downButton = new ButtonBuilder().setCustomId('SNAKE_down').setStyle(ButtonStyle.Primary).setEmoji('⬇️');
    const rightButton = new ButtonBuilder().setCustomId('SNAKE_right').setStyle(ButtonStyle.Primary).setEmoji('➡️');
    const stopButton = new ButtonBuilder().setCustomId('SNAKE_stop').setStyle(ButtonStyle.Danger).setEmoji('✖️');

    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(disabledOneButton, upButton, disabledTwoButton, stopButton),
      new ActionRowBuilder<ButtonBuilder>().addComponents(leftButton, downButton, rightButton)
    ];
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
}
