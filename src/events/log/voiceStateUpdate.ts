import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

export default new Event({
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(client, oldState, newState) {
    const guild = newState.guild;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.voiceStateUpdate || !config.log.channelId || !newState.member || !oldState.member) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = config.language;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.voiceStateUpdate.title', { lng }))
      .addFields({
        name: t('log.voiceStateUpdate.member', { lng }),
        value: `${newState.member.toString()} (\`${newState.member.user.username}\` | ${newState.member.user.id})`,
      })
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if ((newState.selfDeaf ?? false) !== (oldState.selfDeaf ?? false))
      embed.addFields(
        {
          name: t('log.voiceStateUpdate.old_self_deaf', { lng }),
          value: `${oldState.selfDeaf}`,
          inline: true,
        },
        {
          name: t('log.voiceStateUpdate.new_self_deaf', { lng }),
          value: `${newState.selfDeaf}`,
          inline: true,
        },
        emptyField,
      );
    if ((newState.serverDeaf ?? false) !== (oldState.serverDeaf ?? false))
      embed.addFields(
        {
          name: t('log.voiceStateUpdate.old_server_deaf', { lng }),
          value: `${oldState.serverDeaf}`,
          inline: true,
        },
        {
          name: t('log.voiceStateUpdate.new_server_deaf', { lng }),
          value: `${newState.serverDeaf}`,
          inline: true,
        },
        emptyField,
      );
    if ((newState.selfMute ?? false) !== (oldState.selfMute ?? false))
      embed.addFields(
        {
          name: t('log.voiceStateUpdate.old_self_mute', { lng }),
          value: `${oldState.selfMute}`,
          inline: true,
        },
        {
          name: t('log.voiceStateUpdate.new_self_mute', { lng }),
          value: `${newState.selfMute}`,
          inline: true,
        },
        emptyField,
      );
    if ((newState.serverMute ?? false) !== (oldState.serverMute ?? false))
      embed.addFields(
        {
          name: t('log.voiceStateUpdate.old_server_mute', { lng }),
          value: `${oldState.serverMute}`,
          inline: true,
        },
        {
          name: t('log.voiceStateUpdate.new_server_mute', { lng }),
          value: `${newState.serverMute}`,
          inline: true,
        },
        emptyField,
      );
    if ((newState.selfVideo ?? false) !== (oldState.selfVideo ?? false))
      embed.addFields(
        {
          name: t('log.voiceStateUpdate.old_self_video', { lng }),
          value: `${oldState.selfVideo}`,
          inline: true,
        },
        {
          name: t('log.voiceStateUpdate.new_self_video', { lng }),
          value: `${newState.selfVideo}`,
          inline: true,
        },
        emptyField,
      );
    if ((newState.streaming ?? false) !== (oldState.streaming ?? false))
      embed.addFields(
        {
          name: t('log.voiceStateUpdate.old_streaming', { lng }),
          value: `${oldState.streaming}`,
          inline: true,
        },
        {
          name: t('log.voiceStateUpdate.new_streaming', { lng }),
          value: `${newState.streaming}`,
          inline: true,
        },
        emptyField,
      );
    if (newState.channelId !== oldState.channelId)
      embed.addFields(
        {
          name: t('log.voiceStateUpdate.old_channel', { lng }),
          value: oldState.channel ? `${oldState.channel.toString()} (\`${oldState.channel.name}\` | ${oldState.channelId})` : '/',
          inline: true,
        },
        {
          name: t('log.voiceStateUpdate.new_channel', { lng }),
          value: newState.channel ? `${newState.channel.toString()} (\`${newState.channel.name}\` | ${newState.channelId})` : '/',
          inline: true,
        },
        emptyField,
      );

    await logChannel.send({ embeds: [embed] });
  },
});
