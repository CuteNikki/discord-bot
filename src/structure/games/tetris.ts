import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, ComponentType, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { t } from 'i18next';

import type { DiscordClient } from 'classes/client';

import { getUserLanguage } from 'db/language';

import { logger } from 'utils/logger';

const TETROMINOES = {
  I: [[1, 1, 1, 1]],
  J: [
    [1, 0, 0],
    [1, 1, 1]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1]
  ]
};

const PIECES = 'IJLOSTZ';

export class Tetris {
  private board: number[][];
  private score: number = 0;
  private pieceQueue: string[];
  private currentPiece!: number[][];
  private currentPosition!: { x: number; y: number };

  constructor(
    public options: {
      interaction: ChatInputCommandInteraction;
      client: DiscordClient;
    }
  ) {
    this.board = this.createBoard(18, 10);
    this.pieceQueue = this.shufflePieces();
    this.start();
  }

  private createBoard(rows: number, cols: number): number[][] {
    const board = [];
    for (let r = 0; r < rows; r++) {
      board.push(new Array(cols).fill(0));
    }
    return board;
  }

  private getBoardContent(): string {
    const boardCopy = this.board.map((row) => [...row]);

    // Place the current piece on the board copy
    this.currentPiece.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value && this.currentPosition.y + y < boardCopy.length && this.currentPosition.x + x < boardCopy[0].length) {
          boardCopy[this.currentPosition.y + y][this.currentPosition.x + x] = value;
        }
      });
    });

    // Convert the board to a string representation
    return boardCopy.map((row) => row.map((cell) => (cell ? '⬜' : '⬛')).join('')).join('\n');
  }

  private async start() {
    const interaction = this.options.interaction;
    const user = interaction.user;
    const lng = await getUserLanguage(user.id);

    this.spawnNewPiece();

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
            .setTitle(t('games.tetris.title', { lng }))
            .setDescription(this.getBoardContent())
            .addFields(
              {
                name: t('games.tetris.score', { lng }),
                value: `${this.score}`
              },
              {
                name: t('games.tetris.pieces', { lng }),
                value: `${this.pieceQueue.join(', ')}`
              }
            )
        ],
        components: [this.getComponents()]
      })
      .catch((err) => logger.debug({ err }, 'Could not send message'));

    if (!message) return;

    const collector = message.createMessageComponentCollector({
      idle: 60 * 1000,
      componentType: ComponentType.Button
    });

    collector.on('collect', async (buttonInteraction) => {
      await buttonInteraction.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));

      if (buttonInteraction.user.id !== user.id)
        return buttonInteraction
          .followUp({
            content: t('interactions.author-only', {
              lng: await getUserLanguage(buttonInteraction.user.id)
            }),
            ephemeral: true
          })
          .catch((err) => logger.debug({ err }, 'Could not follow up'));

      const move = buttonInteraction.customId.split('_')[1];

      try {
        if (move === 'left') this.movePiece('left');
        else if (move === 'right') this.movePiece('right');
        else if (move === 'rotate') this.rotatePiece();
        else if (move === 'drop') this.dropPiece();

        await buttonInteraction
          .editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.Yellow)
                .setAuthor({
                  name: user.displayName,
                  iconURL: user.displayAvatarURL()
                })
                .setTitle(t('games.tetris.title', { lng }))
                .setDescription(this.getBoardContent())
                .addFields(
                  {
                    name: t('games.tetris.score', { lng }),
                    value: `${this.score}`
                  },
                  {
                    name: t('games.tetris.pieces', { lng }),
                    value: `${this.pieceQueue.join(', ')}`
                  }
                )
            ]
          })
          .catch((err) => logger.debug({ err }, 'Could not edit message'));
      } catch (err: unknown) {
        logger.debug({ err }, 'Could not move piece');
        collector.stop();
      }
    });

    collector.on('end', async () => {
      await this.getResult(lng);
    });
  }

  private async getResult(lng: string) {
    const interaction = this.options.interaction;
    const user = interaction.user;

    return await interaction
      .editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setAuthor({
              name: user.displayName,
              iconURL: user.displayAvatarURL()
            })
            .setTitle(t('games.tetris.title', { lng }))
            .setDescription([t('games.tetris.over', { lng }), this.getBoardContent()].join('\n\n'))
            .addFields(
              {
                name: t('games.tetris.score', { lng }),
                value: `${this.score}`
              },
              {
                name: t('games.tetris.pieces', { lng }),
                value: `${this.pieceQueue.join(', ')}`
              }
            )
        ],
        components: [this.getComponents(true)]
      })
      .catch((err) => logger.debug({ err }, 'Could not edit message'));
  }

  private getComponents(disabled: boolean = false) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('button-tetris_left').setEmoji('⬅️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
      new ButtonBuilder().setCustomId('button-tetris_right').setEmoji('➡️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
      new ButtonBuilder().setCustomId('button-tetris_rotate').setEmoji('🔄').setStyle(ButtonStyle.Primary).setDisabled(disabled),
      new ButtonBuilder().setCustomId('button-tetris_drop').setEmoji('⬇️').setStyle(ButtonStyle.Success).setDisabled(disabled)
    );
  }

  private shufflePieces(): string[] {
    const shuffledPieces = [...PIECES];
    for (let i = shuffledPieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPieces[i], shuffledPieces[j]] = [shuffledPieces[j], shuffledPieces[i]];
    }
    return shuffledPieces;
  }

  private spawnNewPiece() {
    if (this.pieceQueue.length === 1) {
      this.pieceQueue.push(...this.shufflePieces());
    }

    const pieceType = this.pieceQueue.shift()!;
    this.currentPiece = TETROMINOES[pieceType as keyof typeof TETROMINOES];
    this.currentPosition = {
      x: Math.floor(this.board[0].length / 2) - Math.floor(this.currentPiece[0].length / 2),
      y: 0
    };

    if (this.isCollision(this.currentPiece, this.currentPosition)) {
      this.mergePiece(this.currentPiece, this.currentPosition);
      throw new Error('Game Over');
    }
  }

  private isCollision(piece: number[][], pos: { x: number; y: number }): boolean {
    for (let y = 0; y < piece.length; y++) {
      for (let x = 0; x < piece[y].length; x++) {
        if (piece[y][x] && (this.board[y + pos.y] && this.board[y + pos.y][x + pos.x]) !== 0) {
          return true;
        }
      }
    }
    return false;
  }

  private mergePiece(piece: number[][], pos: { x: number; y: number }) {
    piece.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          this.board[y + pos.y][x + pos.x] = value;
        }
      });
    });
    this.clearLines();
  }

  private clearLines() {
    outer: for (let y = this.board.length - 1; y >= 0; y--) {
      for (let x = 0; x < this.board[y].length; x++) {
        if (!this.board[y][x]) {
          continue outer;
        }
      }
      const row = this.board.splice(y, 1)[0].fill(0);
      this.board.unshift(row);
      this.score += 10;
      y++;
    }
  }

  public movePiece(direction: string) {
    const pos = { ...this.currentPosition };
    if (direction === 'left') pos.x -= 1;
    if (direction === 'right') pos.x += 1;

    if (!this.isCollision(this.currentPiece, pos)) {
      this.currentPosition = pos;
    }
  }

  public rotatePiece() {
    const rotatedPiece = this.currentPiece[0].map((_, index) => this.currentPiece.map((row) => row[index]).reverse());
    if (!this.isCollision(rotatedPiece, this.currentPosition)) {
      this.currentPiece = rotatedPiece;
    }
  }

  public dropPiece() {
    const pos = { ...this.currentPosition };
    pos.y += 1;
    if (!this.isCollision(this.currentPiece, pos)) {
      this.currentPosition = pos;
    } else {
      this.mergePiece(this.currentPiece, this.currentPosition);
      this.spawnNewPiece();
    }
  }
}
