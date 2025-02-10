import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { LoggedEvent } from 'types/guild-log';

export default new Event({
  name: Events.GuildStickerUpdate,
  once: false,
  async execute(_client, oldSticker, newSticker) {
    const guild = newSticker.guild;

    if (!guild) {
      return;
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as LoggedEvent[] };

    const event = log.events.find((e) => e.name === Events.GuildStickerUpdate) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | StickerUpdate: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.stickerUpdate.title', { lng }))
      .setThumbnail(newSticker.url)
      .addFields({
        name: t('log.stickerUpdate.sticker', { lng }),
        value: `\`${newSticker.name}\` (${newSticker.id})`
      })
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newSticker.name !== oldSticker.name) {
      embed.addFields(
        {
          name: t('log.stickerUpdate.old-name', { lng }),
          value: oldSticker.name,
          inline: true
        },
        {
          name: t('log.stickerUpdate.new-name', { lng }),
          value: newSticker.name,
          inline: true
        },
        emptyField
      );
    }

    if (newSticker.description !== oldSticker.description) {
      embed.addFields(
        {
          name: t('log.stickerUpdate.old-description', { lng }),
          value: oldSticker.description ?? '/',
          inline: true
        },
        {
          name: t('log.stickerUpdate.new-description', { lng }),
          value: newSticker.description ?? '/',
          inline: true
        },
        emptyField
      );
    }

    if (newSticker.tags !== oldSticker.tags) {
      embed.addFields(
        {
          name: t('log.stickerUpdate.old-tags', { lng }),
          value: oldSticker.tags ?? '/',
          inline: true
        },
        {
          name: t('log.stickerUpdate.new-tags', { lng }),
          value: newSticker.tags ?? '/',
          inline: true
        },
        emptyField
      );
    }

    await logChannel.send({ embeds: [embed] }).catch((err) => logger.debug({ err }, 'GuildLog | StickerUpdate: Could not send message'));
  }
});
