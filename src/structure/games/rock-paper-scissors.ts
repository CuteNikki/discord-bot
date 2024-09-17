import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, type ChatInputCommandInteraction, type User } from 'discord.js';
import { t } from 'i18next';

import { Opponent } from 'games/opponent';

import type { DiscordClient } from 'classes/client';

import { getUserLanguage } from 'db/user';

import { logger } from 'utils/logger';

enum CustomIds {
  Rock = 'RPS_Rock',
  Paper = 'RPS_Paper',
  Scissors = 'RPS_Scissors',
}
enum Picks {
  Rock = '🪨',
  Paper = '🧻',
  Scissors = '✂️',
}

export class RockPaperScissors extends Opponent {
  playerPick: Picks | null = null;
  opponentPick: Picks | null = null;
  constructor(
    public options: {
      interaction: ChatInputCommandInteraction;
      opponent: User | null;
      client: DiscordClient;
    },
  ) {
    super(options);

    this.start();
  }

  private async start() {
    const interaction = this.options.interaction;
    const user = interaction.user;
    const opponent = this.options.opponent;

    const lng = await getUserLanguage(user.id);
    const opponentLng = await getUserLanguage(opponent?.id);

    const rockButton = new ButtonBuilder()
      .setLabel(t('games.rpc.choices.rock', { lng }))
      .setEmoji('🪨')
      .setCustomId(CustomIds.Rock)
      .setStyle(ButtonStyle.Primary);
    const paperButton = new ButtonBuilder()
      .setLabel(t('games.rpc.choices.paper', { lng }))
      .setEmoji('🧻')
      .setCustomId(CustomIds.Paper)
      .setStyle(ButtonStyle.Primary);
    const scissorsButton = new ButtonBuilder()
      .setLabel(t('games.rpc.choices.scissors', { lng }))
      .setEmoji('✂️')
      .setCustomId(CustomIds.Scissors)
      .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(rockButton, paperButton, scissorsButton);

    let message = null;

    if (opponent) {
      message = await this.isApprovedByOpponent();
    } else {
      const picks = Object.values(Picks);
      const randomIndex = Math.floor(Math.random() * picks.length);
      const randomPick = picks[randomIndex];
      this.opponentPick = randomPick as Picks;

      message = await interaction
        .editReply({
          content: t('games.rpc.bot', { lng }),
        })
        .catch((err) => logger.debug({ err }, 'Could not edit message'));
    }

    if (!message) return;

    await interaction
      .editReply({
        content: null,
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setTitle(t('games.rpc.title', { lng }))
            .setDescription(t('games.rpc.description', { lng, player: user.toString() })),
        ],
        components: [row],
      })
      .catch((err) => logger.debug({ err }, 'Could not edit message'));

    const collector = message.createMessageComponentCollector({
      idle: 60 * 1000,
    });

    collector.on('collect', async (buttonInteraction) => {
      await buttonInteraction.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));

      if (buttonInteraction.user.id !== user.id && buttonInteraction.user.id !== opponent?.id) {
        return buttonInteraction.followUp({
          content: t('interactions.author_only', {
            lng: await getUserLanguage(buttonInteraction.user.id),
          }),
          ephemeral: true,
        });
      }

      if (buttonInteraction.user.id === user.id) {
        if (this.playerPick)
          return buttonInteraction
            .followUp({
              content: t('games.rpc.already', { lng }),
              ephemeral: true,
            })
            .catch((err) => logger.debug({ err }, 'Could not follow up'));
        this.playerPick = Picks[buttonInteraction.customId.split('_')[1] as keyof typeof Picks];
        await buttonInteraction
          .followUp({
            content: t('games.rpc.picked', { lng, pick: this.playerPick }),
            ephemeral: true,
          })
          .catch((err) => logger.debug({ err }, 'Could not follow up'));
      }

      if (buttonInteraction.user.id === opponent?.id) {
        if (this.opponentPick)
          return buttonInteraction
            .followUp({
              content: t('games.rpc.already', { lng: opponentLng }),
              ephemeral: true,
            })
            .catch((err) => logger.debug({ err }, 'Could not follow up'));
        this.opponentPick = Picks[buttonInteraction.customId.split('_')[1] as keyof typeof Picks];
        await buttonInteraction
          .followUp({
            content: t('games.rpc.picked', {
              lng: opponentLng,
              pick: this.opponentPick,
            }),
            ephemeral: true,
          })
          .catch((err) => logger.debug({ err }, 'Could not follow up'));
      }

      if (this.opponentPick && this.playerPick) return collector.stop();
    });

    collector.on('end', async () => {
      return await this.getResult(lng);
    });
  }

  private isPlayerWinner() {
    return (
      (this.playerPick === Picks.Rock && this.opponentPick === Picks.Scissors) ||
      (this.playerPick === Picks.Paper && this.opponentPick === Picks.Rock) ||
      (this.playerPick === Picks.Scissors && this.opponentPick === Picks.Paper)
    );
  }

  private async getResult(lng: string) {
    const interaction = this.options.interaction;
    const user = interaction.user;
    const opponent = this.options.opponent;
    const client = interaction.client;

    let result: 'TIMEOUT' | 'TIE' | 'PLAYER' | 'OPPONENT' | null = null;

    if (!this.playerPick || !this.opponentPick) result = 'TIMEOUT';
    else if (this.playerPick === this.opponentPick) result = 'TIE';
    else if (this.isPlayerWinner()) result = 'PLAYER';
    else result = 'OPPONENT';

    const embed = new EmbedBuilder()
      .setTitle(t('games.rpc.title', { lng }))
      .setColor(result === 'TIE' ? Colors.Yellow : result === 'TIMEOUT' ? Colors.Yellow : result === 'OPPONENT' ? Colors.Red : Colors.Green)
      .addFields(
        {
          name: user.displayName,
          value: this.playerPick ?? '❔',
          inline: true,
        },
        { name: 'vs', value: '⚡', inline: true },
        {
          name: opponent?.displayName ?? client.user.displayName,
          value: this.opponentPick ?? '❔',
          inline: true,
        },
      );

    if (result === 'TIMEOUT') embed.setDescription(t('games.rpc.timeout', { lng }));
    else if (result === 'TIE') embed.setDescription(t('games.rpc.tied', { lng }));
    else if (result === 'PLAYER') embed.setDescription(t('games.rpc.winner', { lng, winner: user.toString() }));
    else
      embed.setDescription(
        t('games.rpc.winner', {
          lng,
          winner: opponent?.toString() ?? client.user.toString(),
        }),
      );

    return await interaction
      .editReply({
        content: null,
        embeds: [embed],
        components: [],
      })
      .catch((err) => logger.debug({ err }, 'Could not edit message'));
  }
}
