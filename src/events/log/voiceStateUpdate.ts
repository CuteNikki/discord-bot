import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { LoggedEvent } from 'types/guild-log';

export default new Event({
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(_client, oldState, newState) {
    const guild = newState.guild;

    if (!guild || !newState.member || !oldState.member) {
      return;
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as LoggedEvent[] };

    const event = log.events.find((e) => e.name === Events.VoiceStateUpdate) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels
      .fetch(event.channelId)
      .catch((err) => logger.debug({ err }, 'GuildLog | VoiceStateUpdate: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.voiceStateUpdate.title', { lng }))
      .addFields({
        name: t('log.voiceStateUpdate.member', { lng }),
        value: `${newState.member.toString()} (\`${newState.member.user.username}\` | ${newState.member.user.id})`
      })
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if ((newState.selfDeaf ?? false) !== (oldState.selfDeaf ?? false)) {
      embed.addFields(
        {
          name: t('log.voiceStateUpdate.old-self-deaf', { lng }),
          value: `${oldState.selfDeaf}`,
          inline: true
        },
        {
          name: t('log.voiceStateUpdate.new-self-deaf', { lng }),
          value: `${newState.selfDeaf}`,
          inline: true
        },
        emptyField
      );
    }

    if ((newState.serverDeaf ?? false) !== (oldState.serverDeaf ?? false)) {
      embed.addFields(
        {
          name: t('log.voiceStateUpdate.old-server-deaf', { lng }),
          value: `${oldState.serverDeaf}`,
          inline: true
        },
        {
          name: t('log.voiceStateUpdate.new-server-deaf', { lng }),
          value: `${newState.serverDeaf}`,
          inline: true
        },
        emptyField
      );
    }

    if ((newState.selfMute ?? false) !== (oldState.selfMute ?? false)) {
      embed.addFields(
        {
          name: t('log.voiceStateUpdate.old-self-mute', { lng }),
          value: `${oldState.selfMute}`,
          inline: true
        },
        {
          name: t('log.voiceStateUpdate.new-self-mute', { lng }),
          value: `${newState.selfMute}`,
          inline: true
        },
        emptyField
      );
    }

    if ((newState.serverMute ?? false) !== (oldState.serverMute ?? false)) {
      embed.addFields(
        {
          name: t('log.voiceStateUpdate.old-server-mute', { lng }),
          value: `${oldState.serverMute}`,
          inline: true
        },
        {
          name: t('log.voiceStateUpdate.new-server-mute', { lng }),
          value: `${newState.serverMute}`,
          inline: true
        },
        emptyField
      );
    }

    if ((newState.selfVideo ?? false) !== (oldState.selfVideo ?? false)) {
      embed.addFields(
        {
          name: t('log.voiceStateUpdate.old-self-video', { lng }),
          value: `${oldState.selfVideo}`,
          inline: true
        },
        {
          name: t('log.voiceStateUpdate.new-self-video', { lng }),
          value: `${newState.selfVideo}`,
          inline: true
        },
        emptyField
      );
    }

    if ((newState.streaming ?? false) !== (oldState.streaming ?? false)) {
      embed.addFields(
        {
          name: t('log.voiceStateUpdate.old-streaming', { lng }),
          value: `${oldState.streaming}`,
          inline: true
        },
        {
          name: t('log.voiceStateUpdate.new-streaming', { lng }),
          value: `${newState.streaming}`,
          inline: true
        },
        emptyField
      );
    }

    if (newState.channelId !== oldState.channelId) {
      embed.addFields(
        {
          name: t('log.voiceStateUpdate.old-channel', { lng }),
          value: oldState.channel ? `${oldState.channel.toString()} (\`${oldState.channel.name}\` | ${oldState.channelId})` : '/',
          inline: true
        },
        {
          name: t('log.voiceStateUpdate.new-channel', { lng }),
          value: newState.channel ? `${newState.channel.toString()} (\`${newState.channel.name}\` | ${newState.channelId})` : '/',
          inline: true
        },
        emptyField
      );
    }

    await logChannel.send({ embeds: [embed] }).catch((err) => logger.debug({ err }, 'GuildLog | VoiceStateUpdate: Could not send message'));
  }
});
