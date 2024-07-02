import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(client, oldState, newState) {
    const guild = newState.guild;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.voiceStateUpdate || !config.log.channelId || !newState.member || !oldState.member) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle('Voice State Update')
      .addFields({
        name: 'Member',
        value: `${newState.member.toString()} (\`${newState.member.user.username}\` | ${newState.member.user.id})`,
      });

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if ((newState.selfDeaf ?? false) !== (oldState.selfDeaf ?? false))
      embed.addFields(
        { name: 'Old Self Deaf', value: `${oldState.selfDeaf}`, inline: true },
        { name: 'New Self Deaf', value: `${newState.selfDeaf}`, inline: true },
        emptyField
      );
    if ((newState.serverDeaf ?? false) !== (oldState.serverDeaf ?? false))
      embed.addFields(
        { name: 'Old Server Deaf', value: `${oldState.serverDeaf}`, inline: true },
        { name: 'New Server Deaf', value: `${newState.serverDeaf}`, inline: true },
        emptyField
      );
    if ((newState.selfMute ?? false) !== (oldState.selfMute ?? false))
      embed.addFields(
        { name: 'Old Self Mute', value: `${oldState.selfMute}`, inline: true },
        { name: 'New Self Mute', value: `${newState.selfMute}`, inline: true },
        emptyField
      );
    if ((newState.serverMute ?? false) !== (oldState.serverMute ?? false))
      embed.addFields(
        { name: 'Old Server Mute', value: `${oldState.serverMute}`, inline: true },
        { name: 'New Server Mute', value: `${newState.serverMute}`, inline: true },
        emptyField
      );
    if ((newState.selfVideo ?? false) !== (oldState.selfVideo ?? false))
      embed.addFields(
        { name: 'Old Webcam Sharing', value: `${oldState.selfVideo}`, inline: true },
        { name: 'New Webcam Sharing', value: `${newState.selfVideo}`, inline: true },
        emptyField
      );
    if ((newState.streaming ?? false) !== (oldState.streaming ?? false))
      embed.addFields(
        { name: 'Old Streaming', value: `${oldState.streaming}`, inline: true },
        { name: 'New Streaming', value: `${newState.streaming}`, inline: true },
        emptyField
      );
    if (newState.channelId !== oldState.channelId)
      embed.addFields(
        {
          name: 'Old Channel',
          value: oldState.channel ? `${oldState.channel.toString()} (\`${oldState.channel.name}\` | ${oldState.channelId})` : '/',
          inline: true,
        },
        {
          name: 'New Channel',
          value: newState.channel ? `${newState.channel.toString()} (\`${newState.channel.name}\` | ${newState.channelId})` : '/',
          inline: true,
        },
        emptyField
      );

    await logChannel.send({ embeds: [embed] });
  },
});
