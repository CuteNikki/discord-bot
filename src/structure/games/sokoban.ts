import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, ComponentType, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { t } from 'i18next';

import type { DiscordClient } from 'classes/client';

import { logger } from 'utils/logger';

type Cell = 0 | 1 | 2 | 3 | 4 | 5; // 0: empty space, 1: wall, 2: box, 3: storage, 4: player, 5: box on storage

export class Sokoban {
  private board: Cell[][];
  private initialBoard: Cell[][];
  private playerPosition: { x: number; y: number };

  constructor(
    public options: {
      client: DiscordClient;
      interaction: ChatInputCommandInteraction;
      rows?: number;
      cols?: number;
    },
  ) {
    this.board = this.generateSolvableLevel(options.rows ?? 10, options.cols ?? 10);
    this.initialBoard = this.cloneBoard(this.board);
    this.playerPosition = this.findPlayerPosition();
    this.start();
  }

  private async start() {
    const interaction = this.options.interaction;
    const user = interaction.user;
    const client = this.options.client;
    const lng = await client.getUserLanguage(user.id);

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
            .setTitle(t('games.sokoban.title', { lng }))
            .setDescription(this.getBoardContent()),
        ],
        components: this.getComponents(),
      })
      .catch((err) => logger.debug({ err }, 'Could not send message'));
    if (!message) return;

    const collector = message.createMessageComponentCollector({
      idle: 60 * 1000,
      componentType: ComponentType.Button,
    });

    collector.on('collect', async (buttonInteraction) => {
      await buttonInteraction.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));

      if (buttonInteraction.user.id !== user.id)
        return buttonInteraction
          .followUp({
            content: t('interactions.author_only', {
              lng: await client.getUserLanguage(buttonInteraction.user.id),
            }),
            ephemeral: true,
          })
          .catch((err) => logger.debug({ err }, 'Could not follow up'));

      const move = buttonInteraction.customId.split('_')[1];

      if (move === 'restart') this.restart();
      else if (move === 'up') this.moveUp();
      else if (move === 'down') this.moveDown();
      else if (move === 'left') this.moveLeft();
      else if (move === 'right') this.moveRight();

      await buttonInteraction
        .editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Yellow)
              .setAuthor({
                name: user.displayName,
                iconURL: user.displayAvatarURL(),
              })
              .setTitle(t('games.sokoban.title', { lng }))
              .setDescription(this.getBoardContent()),
          ],
        })
        .catch((err) => logger.debug({ err }, 'Could not edit message'));

      if (this.isWon()) collector.stop();
    });

    collector.on('end', () => {
      this.getResult(lng);
    });
  }

  private async getResult(lng: string) {
    const interaction = this.options.interaction;
    const user = interaction.user;

    const isWon = this.isWon();

    return await interaction
      .editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(isWon ? Colors.Green : Colors.Red)
            .setAuthor({
              name: user.displayName,
              iconURL: user.displayAvatarURL(),
            })
            .setTitle(t('games.sokoban.title', { lng }))
            .setDescription([isWon ? t('games.sokoban.win', { lng }) : t('games.sokoban.lose', { lng }), this.getBoardContent()].join('\n\n')),
        ],
        components: this.getComponents(true),
      })
      .catch((err) => logger.debug({ err }, 'Could not edit message'));
  }

  private getComponents(disabled: boolean = false) {
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('SOKOBAN_disabled_one').setLabel('\u200b').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('SOKOBAN_up').setEmoji('⬆️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
        new ButtonBuilder().setCustomId('SOKOBAN_disabled_two').setLabel('\u200b').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('SOKOBAN_restart').setEmoji('🔄').setStyle(ButtonStyle.Danger).setDisabled(disabled),
      ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('SOKOBAN_left').setEmoji('⬅️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
        new ButtonBuilder().setCustomId('SOKOBAN_down').setEmoji('⬇️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
        new ButtonBuilder().setCustomId('SOKOBAN_right').setEmoji('➡️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
      ),
    ];
  }

  private generateSolvableLevel(rows: number, cols: number): Cell[][] {
    let board: Cell[][];

    // Attempt to generate a solvable board multiple times
    const maxAttempts = 100;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      board = this.createEmptyBoard(rows, cols);
      this.placeWalls(board); // Place walls
      const { playerX, playerY } = this.placePlayer(board);
      const { boxes, storages } = this.placeBoxesAndStorages(board);

      // Check if all boxes are reachable
      let allBoxesReachable = true;
      for (let i = 0; i < boxes.length; i++) {
        if (!this.isBoxReachable(board, boxes[i].x, boxes[i].y, storages[i].x, storages[i].y)) {
          allBoxesReachable = false;
          break;
        }
      }

      if (allBoxesReachable) {
        return board;
      }
    }

    throw new Error(`Failed to generate a solvable level after ${maxAttempts} attempts.`);
  }

  private createEmptyBoard(rows: number, cols: number): Cell[][] {
    const board: Cell[][] = [];
    for (let y = 0; y < rows; y++) {
      board[y] = [];
      for (let x = 0; x < cols; x++) {
        board[y][x] = 0; // Empty space
      }
    }
    return board;
  }

  private placeWalls(board: Cell[][]): void {
    // Place walls around the board edges
    const rows = board.length;
    const cols = board[0].length;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) {
          board[y][x] = 1; // Wall
        }
      }
    }
  }

  private placePlayer(board: Cell[][]): { playerX: number; playerY: number } {
    let playerX, playerY;
    do {
      playerX = Math.floor(Math.random() * (board[0].length - 2)) + 1; // Exclude edges for random placement
      playerY = Math.floor(Math.random() * (board.length - 2)) + 1;
    } while (board[playerY][playerX] !== 0);

    board[playerY][playerX] = 4; // Player
    return { playerX, playerY };
  }

  private placeBoxesAndStorages(board: Cell[][]): {
    boxes: { x: number; y: number }[];
    storages: { x: number; y: number }[];
  } {
    const boxes: { x: number; y: number }[] = [];
    const storages: { x: number; y: number }[] = [];
    const rows = board.length;
    const cols = board[0].length;

    // Determine valid positions excluding edges and corners
    const validPositions: { x: number; y: number }[] = [];
    for (let y = 2; y < rows - 2; y++) {
      for (let x = 2; x < cols - 2; x++) {
        if (board[y][x] === 0) {
          validPositions.push({ x, y });
        }
      }
    }

    // Randomly place boxes and storages
    const numItems = Math.min(validPositions.length, Math.floor(rows * cols * 0.1));
    for (let i = 0; i < numItems; i++) {
      const index = Math.floor(Math.random() * validPositions.length);
      const { x, y } = validPositions[index];

      // Alternate between placing a box or storage
      if (i % 2 === 0) {
        board[y][x] = 2; // Box
        boxes.push({ x, y });
      } else {
        board[y][x] = 3; // Storage
        storages.push({ x, y });
      }

      // Remove position from valid list
      validPositions.splice(index, 1);
    }

    return { boxes, storages };
  }

  private isBoxReachable(board: Cell[][], bx: number, by: number, sx: number, sy: number): boolean {
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]; // Up, Down, Left, Right

    // Initialize visited array
    const visited: boolean[][] = [];
    for (let y = 0; y < board.length; y++) {
      visited[y] = [];
      for (let x = 0; x < board[y].length; x++) {
        visited[y][x] = false;
      }
    }

    // BFS initialization
    const queue: { x: number; y: number }[] = [];
    queue.push({ x: bx, y: by });
    visited[by][bx] = true;

    // BFS loop
    while (queue.length > 0) {
      const current = queue.shift()!;
      const cx = current.x;
      const cy = current.y;

      // Check if the current position is the storage position
      if (cx === sx && cy === sy) {
        return true; // Box can reach storage
      }

      // Explore neighbors
      for (const [dx, dy] of directions) {
        const nx = cx + dx;
        const ny = cy + dy;

        // Check bounds and if the neighbor is reachable
        if (nx >= 0 && nx < board[0].length && ny >= 0 && ny < board.length && !visited[ny][nx] && (board[ny][nx] === 0 || board[ny][nx] === 3)) {
          queue.push({ x: nx, y: ny });
          visited[ny][nx] = true;
        }
      }
    }

    return false; // Box cannot reach storage
  }

  private findPlayerPosition(): { x: number; y: number } {
    for (let y = 0; y < this.board.length; y++) {
      for (let x = 0; x < this.board[y].length; x++) {
        if (this.board[y][x] === 4) {
          return { x, y };
        }
      }
    }
    throw new Error('Player not found on the board');
  }

  private cloneBoard(board: Cell[][]): Cell[][] {
    return board.map((row) => [...row]);
  }

  private movePlayer(dx: number, dy: number): void {
    const { x: px, y: py } = this.playerPosition;
    const nx = px + dx;
    const ny = py + dy;

    if (this.isValidMove(nx, ny)) {
      let nextCell = this.board[ny][nx];

      // Check if the next cell is a box (2) or a box on storage (5)
      if (nextCell === 2 || nextCell === 5) {
        // Calculate the cell after the box
        const bx = nx + dx;
        const by = ny + dy;

        // Check if the cell after the box is empty (0) or another box that can be pushed (2 or 5)
        if (this.isValidMove(bx, by)) {
          let cellAfterBox = this.board[by][bx];

          if (cellAfterBox === 0 || cellAfterBox === 3) {
            // Move the box to the cell after it
            this.board[by][bx] = cellAfterBox === 3 ? 5 : 2; // Box on storage if moved to a storage, otherwise normal box
            nextCell = cellAfterBox;
          } else if (cellAfterBox === 2 || cellAfterBox === 5) {
            // Cannot push two boxes consecutively
            return;
          }
        }
      }

      // Move player to new position
      if (this.initialBoard[py][px] === 0) {
        this.board[py][px] = 0; // Restore empty space
      } else if (this.initialBoard[py][px] === 2) {
        this.board[py][px] = 0; // Reset box to empty space
      } else if (this.initialBoard[py][px] === 3) {
        this.board[py][px] = this.initialBoard[py][px]; // Restore storage or box on storage
      } else if (this.initialBoard[py][px] === 4) {
        this.board[py][px] = 0; // Reset previous player position to empty space
      }

      this.board[ny][nx] = 4; // Set new position as player
      this.playerPosition = { x: nx, y: ny }; // Update player position
    }
  }

  private isValidMove(x: number, y: number): boolean {
    if (x < 0 || x >= this.board[0].length || y < 0 || y >= this.board.length) {
      return false; // Out of bounds
    }
    const cell = this.board[y][x];
    return cell === 0 || cell === 2 || cell === 3 || cell === 5; // Empty space, box, storage, or box on storage
  }

  private moveUp() {
    this.movePlayer(0, -1);
  }
  private moveDown() {
    this.movePlayer(0, 1);
  }
  private moveLeft() {
    this.movePlayer(-1, 0);
  }
  private moveRight() {
    this.movePlayer(1, 0);
  }

  private getBoardContent(): string {
    return this.board
      .map((row) =>
        row
          .map((cell) => {
            switch (cell) {
              case 0:
                return '⬛'; // Empty space
              case 1:
                return '🟦'; // Wall
              case 2:
                return '📦'; // Box
              case 3:
                return '❎'; // Storage
              case 4:
                return '😳'; // Player
              case 5:
                return '✅'; // Box on storage
              default:
                return '';
            }
          })
          .join(''),
      )
      .join('\n');
  }

  private isWon(): boolean {
    return !this.board.some((row) => row.includes(2));
  }

  private restart() {
    this.board = JSON.parse(JSON.stringify(this.initialBoard));
    this.playerPosition = this.findPlayerPosition();
  }
}
