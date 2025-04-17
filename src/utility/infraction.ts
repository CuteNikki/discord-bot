import type { Infraction, InfractionType } from '@prisma/client';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder } from 'discord.js';

import type { ExtendedClient } from 'classes/client';

interface OverviewOptions {
  client: ExtendedClient;
  infractions: Infraction[];
  targetUser: {
    id: string;
    displayName: string;
    displayAvatarURL: () => string;
  };
  page: number;
  itemsPerPage: number;
}

export function buildInfractionOverview({ infractions, targetUser, page, itemsPerPage, client }: OverviewOptions) {
  const staffEmoji = client.customEmojis.staff;
  const dateEmoji = client.customEmojis.date;
  const calendarEmoji = client.customEmojis.calendar;
  const receiptEmoji = client.customEmojis.receipt;
  const pencilEmoji = client.customEmojis.pencil;
  const infinityEmoji = client.customEmojis.infinity;
  const banEmoji = client.customEmojis.ban;
  const hammerEmoji = client.customEmojis.hammer;
  const exclamationEmoji = client.customEmojis.exclamation;
  const clockEmoji = client.customEmojis.clock;
  const backwardsEmoji = client.customEmojis.backwards;
  const forwardsEmoji = client.customEmojis.forwards;
  const nextEmoji = client.customEmojis.forwardstep;
  const previousEmoji = client.customEmojis.backwardstep;

  const totalPages = Math.ceil(infractions.length / itemsPerPage);
  const paged = infractions.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const countByType = (type: InfractionType) => infractions.filter((infraction) => infraction.type === type).length;

  const overviewEmbed = new EmbedBuilder()
    .setColor(Colors.White)
    .setAuthor({ name: `${targetUser.displayName} - Overview`, iconURL: targetUser.displayAvatarURL() })
    .setDescription(
      [
        `${infinityEmoji} Total: ${infractions.length}`,
        `${banEmoji} Bans: ${countByType('Ban')}`,
        `${calendarEmoji} Tempbans: ${countByType('Tempban')}`,
        `${hammerEmoji} Kicks: ${countByType('Kick')}`,
        `${exclamationEmoji} Warns: ${countByType('Warn')}`,
        `${clockEmoji} Timeouts: ${countByType('Timeout')}`,
      ].join('\n'),
    );

  const infractionEmbeds = paged.map((infraction) => {
    const lines = [
      `**${infraction.id}**`,
      `${receiptEmoji} Type: ${infraction.type}`,
      `${pencilEmoji} Reason: ${infraction.reason}`,
      `${staffEmoji} Moderator: <@${infraction.moderatorId}>`,
    ];

    if (infraction.expiresAt) {
      lines.push(
        `${calendarEmoji} ${infraction.isActive ? 'Expires' : 'Expired'}: <t:${Math.floor(infraction.expiresAt.getTime() / 1000)}:R>`,
      );
    }

    lines.push(`${dateEmoji} Date: <t:${Math.floor(infraction.createdAt.getTime() / 1000)}:R>`);

    return new EmbedBuilder().setColor(Colors.White).setDescription(lines.join('\n'));
  });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`infractions-first_${targetUser.id}`)
      .setEmoji({ id: backwardsEmoji.id })
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`infractions-previous_${page}_${targetUser.id}`)
      .setEmoji({ id: previousEmoji.id })
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`infractions-custom_${targetUser.id}`)
      .setLabel(`${page + 1} / ${totalPages}`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`infractions-next_${page}_${targetUser.id}`)
      .setEmoji({ id: nextEmoji.id })
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === totalPages - 1),
    new ButtonBuilder()
      .setCustomId(`infractions-last_${targetUser.id}`)
      .setEmoji({ id: forwardsEmoji.id })
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === totalPages - 1),
  );

  return {
    embeds: [overviewEmbed, ...infractionEmbeds],
    components: [row],
  };
}
