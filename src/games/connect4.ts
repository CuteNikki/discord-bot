import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  type APIButtonComponent,
  type ChatInputCommandInteraction,
  type JSONEncodable,
  type User,
} from 'discord.js';
import i18next from 'i18next';

import { Opponent } from 'games/opponent';

import type { DiscordClient } from 'classes/client';

export class Connect4 extends Opponent {
  numberEmojis: string[] = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  board: string[] = [];
  playerTurn: boolean;
  width: number;
  height: number;
  max_buttons: number;
  constructor(
    public options: {
      interaction: ChatInputCommandInteraction;
      opponent: User;
      client: DiscordClient;
      scale: {
        width: number;
        height: number;
        max_buttons: number;
      };
    }
  ) {
    super(options);

    this.width = this.options.scale.width;
    this.height = this.options.scale.height;
    this.max_buttons = this.options.scale.max_buttons;

    // Filling the board with empty spots
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.board[y * this.width + x] = '⚪';
      }
    }

    // 50% probability of getting true
    const isPlayerStarting = Math.random() < 0.5;

    if (isPlayerStarting) this.playerTurn = true;
    else this.playerTurn = false;

    this.start();
  }

  private getBoardContent() {
    let board = '';
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        board += this.board[y * this.width + x];
      }
      board += '\n';
    }
    board += this.numberEmojis.join('').slice(0, this.width * 3);
    return board;
  }

  private async start() {
    const interaction = this.options.interaction;
    const user = interaction.user;
    const opponent = this.options.opponent;
    const client = this.options.client;

    const lng = await client.getUserLanguage(user.id);
    const opponentLng = await client.getUserLanguage(opponent.id);

    const message = await this.isApprovedByOpponent();
    if (!message) return;

    await interaction
      .editReply({
        content: i18next.t('games.connect.start', this.playerTurn ? { lng, player: user.toString() } : { lng: opponentLng, player: opponent.toString() }),
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setTitle(i18next.t('games.connect.title', { lng }))
            .setDescription(this.getBoardContent())
            .addFields(
              { name: user.displayName, value: '🔵', inline: true },
              { name: 'vs', value: '⚡', inline: true },
              { name: opponent.displayName, value: '🔴', inline: true }
            ),
        ],
        components: this.getComponents(),
      })
      .catch(() => {});

    const collector = message.createMessageComponentCollector({ idle: 60 * 1000 });

    collector.on('collect', async (buttonInteraction) => {
      await buttonInteraction.deferUpdate().catch(() => {});

      if (buttonInteraction.user.id !== user.id && buttonInteraction.user.id !== opponent.id)
        return buttonInteraction
          .followUp({
            content: i18next.t('interactions.author_only', { lng: await client.getUserLanguage(buttonInteraction.user.id) }),
            ephemeral: true,
          })
          .catch(() => {});

      if (this.playerTurn && buttonInteraction.user.id !== user.id)
        return buttonInteraction.followUp({ content: i18next.t('games.connect.turn', { lng: opponentLng }), ephemeral: true }).catch(() => {});

      if (!this.playerTurn && buttonInteraction.user.id !== opponent.id)
        return buttonInteraction.followUp({ content: i18next.t('games.connect.turn', { lng }), ephemeral: true }).catch(() => {});

      const column = parseInt(buttonInteraction.customId.split('_')[1]) - 1;
      const coords = { x: -1, y: -1 };

      for (let y = this.height - 1; y >= 0; y--) {
        const field = this.board[column + y * this.width];
        if (field === '⚪') {
          this.board[column + y * this.width] = this.playerTurn ? '🔵' : '🔴';
          coords.x = column;
          coords.y = y;
          break;
        }
      }

      if (coords.y === 0) {
        const components = buttonInteraction.message.components[column > this.max_buttons - 1 ? 1 : 0].components as JSONEncodable<APIButtonComponent>[];
        components[column % this.max_buttons] = ButtonBuilder.from(components[column % this.max_buttons]).setDisabled(true);
      }

      if (this.isWinningMove(coords) || this.isBoardFull()) {
        return collector.stop();
      }

      this.playerTurn = !this.playerTurn;

      return await buttonInteraction
        .editReply({
          content: i18next.t('games.connect.wait', this.playerTurn ? { lng, player: user.toString() } : { lng: opponentLng, player: opponent.toString() }),
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Yellow)
              .setTitle(i18next.t('games.connect.title', { lng }))
              .setDescription(this.getBoardContent())
              .addFields(
                { name: user.displayName, value: '🔵', inline: true },
                { name: 'vs', value: '⚡', inline: true },
                { name: opponent.displayName, value: '🔴', inline: true }
              ),
          ],
          components: buttonInteraction.message.components,
        })
        .catch(() => {});
    });

    collector.on('end', async (_, reason) => {
      return await this.getResult(lng, reason);
    });
  }

  private isBoardFull(): boolean {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.board[y * this.width + x] === '⚪') return false;
      }
    }
    return true;
  }

  private isWinningMove(coords: { x: number; y: number }): boolean {
    const player = this.playerTurn ? '🔵' : '🔴';
    const board = this.board;

    // horizontal check
    for (let i = Math.max(0, coords.x - 3); i <= coords.x; i++) {
      const adjacent = i + coords.y * this.width;
      if (i + 3 < this.width) {
        if (board[adjacent] === player && board[adjacent + 1] === player && board[adjacent + 2] === player && board[adjacent + 3] === player) {
          return true;
        }
      }
    }
    // vertical check
    for (let i = Math.max(0, coords.y - 3); i <= coords.y; i++) {
      const adjacent = coords.x + i * this.width;
      if (i + 3 < this.height) {
        if (
          board[adjacent] === player &&
          board[adjacent + this.width] === player &&
          board[adjacent + 2 * this.width] === player &&
          board[adjacent + 3 * this.width] === player
        )
          return true;
      }
    }
    // ascending check (diagonal)
    for (let i = -3; i <= 0; i++) {
      const coordinates = { x: coords.x + i, y: coords.y + i };
      const adjacent = coordinates.x + coordinates.y * this.width;
      if (coordinates.x + 3 < this.width && coordinates.y + 3 < this.height) {
        if (
          board[adjacent] === player &&
          board[adjacent + this.width + 1] === player &&
          board[adjacent + 2 * this.width + 2] === player &&
          board[adjacent + 3 * this.width + 3] === player
        )
          return true;
      }
    }
    // descending check (diagonal)
    for (let i = -3; i <= 0; i++) {
      const coordinates = { x: coords.x + i, y: coords.y - i };
      const adjacent = coordinates.x + coordinates.y * this.width;
      if (coordinates.x + 3 < this.width && coordinates.y - 3 >= 0 && coordinates.x >= 0) {
        if (
          board[adjacent] === player &&
          board[adjacent - this.width + 1] === player &&
          board[adjacent - 2 * this.width + 2] === player &&
          board[adjacent - 3 * this.width + 3] === player
        )
          return true;
      }
    }

    return false;
  }

  private async getResult(lng: string, reason: string) {
    const interaction = this.options.interaction;
    const user = interaction.user;
    const opponent = this.options.opponent;

    let result: 'TIMEOUT' | 'TIE' | 'PLAYER' | 'OPPONENT' | null = null;

    if (reason === 'idle') result = 'TIMEOUT';
    else if (this.isBoardFull()) result = 'TIE';
    else if (reason === 'user') result = this.playerTurn ? 'PLAYER' : 'OPPONENT';

    const embed = new EmbedBuilder()
      .setTitle(i18next.t('games.connect.title', { lng }))
      .setColor(result === 'TIE' ? Colors.Yellow : result === 'TIMEOUT' ? Colors.Yellow : result === 'OPPONENT' ? Colors.Red : Colors.Green)
      .addFields(
        { name: user.displayName, value: '🔵', inline: true },
        { name: 'vs', value: '⚡', inline: true },
        { name: opponent.displayName, value: '🔴', inline: true }
      );

    if (result === 'TIMEOUT') embed.setDescription([i18next.t('games.connect.timeout', { lng }), this.getBoardContent()].join('\n\n'));
    else if (result === 'TIE') embed.setDescription([i18next.t('games.connect.tied', { lng }), this.getBoardContent()].join('\n\n'));
    else if (result === 'PLAYER')
      embed.setDescription([i18next.t('games.connect.winner', { lng, winner: user.toString() }), this.getBoardContent()].join('\n\n'));
    else embed.setDescription([i18next.t('games.connect.winner', { lng, winner: opponent.toString() }), this.getBoardContent()].join('\n\n'));

    return await interaction.editReply({ content: null, embeds: [embed], components: this.disableButtons(this.getComponents()) }).catch(() => {});
  }

  private getComponents() {
    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    for (let x = 0; x < Math.ceil(this.width / this.max_buttons); x++) {
      const row = new ActionRowBuilder<ButtonBuilder>();

      for (let y = 0; y < this.max_buttons; y++) {
        const index = x * this.max_buttons + y;
        // Prevent adding more buttons than this.width
        if (index >= this.width) break;
        const button = new ButtonBuilder()
          .setEmoji(this.numberEmojis[index])
          .setStyle(ButtonStyle.Primary)
          .setCustomId(`CONNECT_${index + 1}`);
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
}
