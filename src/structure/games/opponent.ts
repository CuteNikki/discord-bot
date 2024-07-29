import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, Message, type ChatInputCommandInteraction, type User } from 'discord.js';

import type { DiscordClient } from 'classes/client';
import { t } from 'i18next';

import { logger } from 'utils/logger';

enum CustomIds {
  Accept = 'OPPONENT_ACCEPT',
  Reject = 'OPPONENT_REJECT',
}

export class Opponent {
  constructor(
    public options: {
      interaction: ChatInputCommandInteraction;
      opponent: User | null;
      client: DiscordClient;
    },
  ) {}

  public async isApprovedByOpponent(): Promise<Message | false> {
    const user = this.options.interaction.user;
    const opponent = this.options.opponent;
    const interaction = this.options.interaction;
    const client = this.options.client;

    if (!opponent) return false;

    const lng = await client.getUserLanguage(user.id);
    const opponentLng = await client.getUserLanguage(opponent.id);

    if (opponent.id === user.id) {
      await interaction.editReply(t('games.invitation.yourself', { lng })).catch((error) => logger.debug({ error }, 'Could not edit message'));
      return false;
    }

    if (opponent.bot) {
      await interaction.editReply(t('games.invitation.bot', { lng })).catch(() => {});
      return false;
    }

    return new Promise(async (resolve) => {
      const acceptButton = new ButtonBuilder()
        .setLabel(t('games.invitation.accept', { lng: opponentLng }))
        .setCustomId(CustomIds.Accept)
        .setStyle(ButtonStyle.Success);
      const rejectButton = new ButtonBuilder()
        .setLabel(t('games.invitation.reject', { lng: opponentLng }))
        .setCustomId(CustomIds.Reject)
        .setStyle(ButtonStyle.Danger);
      const row = new ActionRowBuilder<ButtonBuilder>().setComponents(acceptButton, rejectButton);

      const message = await interaction
        .editReply({
          content: opponent.toString(),
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Yellow)
              .setTitle(t('games.invitation.title', { lng: opponentLng }))
              .setDescription(
                t('games.invitation.description', {
                  lng: opponentLng,
                  user: user.toString(),
                }),
              ),
          ],
          components: [row],
        })
        .catch((error) => logger.debug({ error }, 'Could not edit message'));
      if (!message) return;

      const collector = message.createMessageComponentCollector({
        time: 30 * 1000,
      });

      collector.on('collect', async (buttonInteraction) => {
        await buttonInteraction.deferUpdate().catch((error) => logger.debug({ error }, 'Could not defer update'));

        if (buttonInteraction.user.id !== opponent.id) {
          return buttonInteraction
            .followUp({
              content: t('interactions.author_only', {
                lng: await client.getUserLanguage(buttonInteraction.user.id),
              }),
              ephemeral: true,
            })
            .catch((error) => logger.debug({ error }, 'Could not follow up'));
        }

        if (buttonInteraction.customId === CustomIds.Accept) return collector.stop('accept');
        if (buttonInteraction.customId === CustomIds.Reject) return collector.stop('reject');
      });

      collector.on('end', async (_, reason) => {
        if (reason === 'accept') return resolve(message);

        const embed = new EmbedBuilder().setColor(Colors.Red);

        if (reason === 'reject')
          embed.setDescription(
            t('games.invitation.rejected', {
              lng,
              opponent: opponent.toString(),
            }),
          );
        if (reason === 'time')
          embed.setDescription(
            t('games.invitation.timeout', {
              lng,
              opponent: opponent.toString(),
            }),
          );

        interaction
          .editReply({
            content: user.toString(),
            embeds: [embed],
            components: [],
          })
          .catch((error) => logger.debug({ error }, 'Could not edit message'));
        return resolve(false);
      });
    });
  }
}
