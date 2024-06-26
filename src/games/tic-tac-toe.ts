import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, type ChatInputCommandInteraction, type User } from 'discord.js';
import i18next from 'i18next';

import { Opponent } from 'games/opponent';

import type { DiscordClient } from 'classes/client';

export class TicTacToe extends Opponent {
  board: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  playerTurn: boolean;
  constructor(
    public options: {
      interaction: ChatInputCommandInteraction;
      opponent: User;
      client: DiscordClient;
    }
  ) {
    super(options);

    // 50% probability of getting true
    const isPlayerStarting = Math.random() < 0.5;

    if (isPlayerStarting) this.playerTurn = true;
    else this.playerTurn = false;

    this.start();
  }

  private async start() {
    const interaction = this.options.interaction;
    const user = interaction.user;
    const opponent = this.options.opponent;
    const client = this.options.client;

    const lng = await client.getLanguage(user.id);
    const opponentLng = await client.getLanguage(opponent.id);

    const message = await this.isApprovedByOpponent();
    if (!message) return;

    interaction
      .editReply({
        content: i18next.t('games.ttt.start', this.playerTurn ? { lng, player: user.toString() } : { lng: opponentLng, player: opponent.toString() }),
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setTitle(i18next.t('games.ttt.title', { lng }))
            .addFields(
              { name: user.displayName, value: '🔹', inline: true },
              { name: 'vs', value: '⚡', inline: true },
              { name: opponent.displayName, value: '🔺', inline: true }
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
            content: i18next.t('interactions.author_only', { lng: await client.getLanguage(buttonInteraction.user.id) }),
            ephemeral: true,
          })
          .catch(() => {});

      if (this.playerTurn && buttonInteraction.user.id !== user.id)
        return buttonInteraction.followUp({ content: i18next.t('games.ttt.turn', { lng: opponentLng }), ephemeral: true }).catch(() => {});

      if (!this.playerTurn && buttonInteraction.user.id !== opponent.id)
        return buttonInteraction.followUp({ content: i18next.t('games.ttt.turn', { lng }), ephemeral: true }).catch(() => {});

      this.board[parseInt(buttonInteraction.customId.split('_')[1])] = this.playerTurn ? 1 : 2;

      if (this.isWinner(1) || this.isWinner(2) || !this.board.includes(0)) {
        return collector.stop();
      }

      this.playerTurn = !this.playerTurn;

      return await buttonInteraction
        .editReply({
          content: i18next.t('games.ttt.wait', this.playerTurn ? { lng, player: user.toString() } : { lng: opponentLng, player: opponent.toString() }),
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Yellow)
              .setTitle(i18next.t('games.ttt.title', { lng }))
              .addFields(
                { name: user.displayName, value: '🔹', inline: true },
                { name: 'vs', value: '⚡', inline: true },
                { name: opponent.displayName, value: '🔺', inline: true }
              ),
          ],
          components: this.getComponents(),
        })
        .catch(() => {});
    });

    collector.on('end', async () => {
      return await this.getResult(lng);
    });
  }
  private async getResult(lng: string) {
    const interaction = this.options.interaction;
    const user = interaction.user;
    const opponent = this.options.opponent;

    let result: 'TIMEOUT' | 'TIE' | 'PLAYER' | 'OPPONENT' | null = null;

    if (!this.isWinner(1) && !this.isWinner(2) && this.board.includes(0)) result = 'TIMEOUT';
    else if (!this.isWinner(1) && !this.isWinner(2) && !this.board.includes(0)) result = 'TIE';
    else if (this.isWinner(1)) result = 'PLAYER';
    else result = 'OPPONENT';

    const embed = new EmbedBuilder()
      .setTitle(i18next.t('games.ttt.title', { lng }))
      .setColor(result === 'TIE' ? Colors.Yellow : result === 'TIMEOUT' ? Colors.Yellow : result === 'OPPONENT' ? Colors.Red : Colors.Green)
      .addFields(
        { name: user.displayName, value: '🔹', inline: true },
        { name: 'vs', value: '⚡', inline: true },
        { name: opponent.displayName, value: '🔺', inline: true }
      );

    if (result === 'TIMEOUT') embed.setDescription(i18next.t('games.ttt.timeout', { lng }));
    else if (result === 'TIE') embed.setDescription(i18next.t('games.ttt.tied', { lng }));
    else if (result === 'PLAYER') embed.setDescription(i18next.t('games.ttt.winner', { lng, winner: user.toString() }));
    else embed.setDescription(i18next.t('games.ttt.winner', { lng, winner: opponent.toString() }));

    return await interaction.editReply({ content: null, embeds: [embed], components: this.disableButtons(this.getComponents()) }).catch(() => {});
  }

  private isWinner(player: number) {
    if (this.board[0] === this.board[4] && this.board[0] === this.board[8] && this.board[0] === player) {
      return true;
    } else if (this.board[6] === this.board[4] && this.board[6] === this.board[2] && this.board[6] === player) {
      return true;
    }
    for (let i = 0; i < 3; i++) {
      if (this.board[i * 3] === this.board[i * 3 + 1] && this.board[i * 3] === this.board[i * 3 + 2] && this.board[i * 3] === player) {
        return true;
      }
      if (this.board[i] === this.board[i + 3] && this.board[i] === this.board[i + 6] && this.board[i] === player) {
        return true;
      }
    }
    return false;
  }

  private getFieldPlayer(player: number) {
    if (player === 1) return { emoji: '🔹', style: ButtonStyle.Primary };
    else if (player === 2) return { emoji: '🔺', style: ButtonStyle.Danger };
    else return { emoji: '➖', style: ButtonStyle.Secondary };
  }

  private getComponents() {
    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    for (let x = 0; x < 3; x++) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      for (let y = 0; y < 3; y++) {
        const fieldPlayer = this.getFieldPlayer(this.board[y * 3 + x]);
        const button = new ButtonBuilder()
          .setEmoji(fieldPlayer.emoji)
          .setStyle(fieldPlayer.style)
          .setCustomId(`TTT_${y * 3 + x}`);
        if (this.board[y * 3 + x]) button.setDisabled(true);
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
