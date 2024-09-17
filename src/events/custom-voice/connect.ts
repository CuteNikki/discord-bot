import { ChannelType, Events, PermissionFlagsBits } from 'discord.js';

import { Event } from 'classes/event';

import { getGuildSettings } from 'db/guild';
import { getCustomVoiceChannelByOwner, createCustomVoiceChannel } from 'db/voice';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(_client, oldState, newState) {
    // If not connecting to a channel or we can't get the member, return
    if (!newState.channelId || !newState.member) return;

    // if there is no creation channel, return
    const config = await getGuildSettings(newState.guild.id);
    if (!config.customVC.channelId) return;

    // If user tries creating a new channel and they still have a channel, move them to that channel
    const existingCustomChannel = await getCustomVoiceChannelByOwner(newState.member.id);
    if (
      existingCustomChannel &&
      (!oldState.channelId || oldState.channelId !== existingCustomChannel.channelId) &&
      newState.guild.channels.cache.get(existingCustomChannel.channelId)?.isVoiceBased()
    ) {
      return newState.member.voice.setChannel(existingCustomChannel.channelId).catch((err) => logger.error(err, 'Could not move user to custom voice channel'));
    }

    if (newState.channelId !== config.customVC.channelId) return;
    // Now we know that the user is in the creation channel

    // We need to create a new voice channel for them
    const newChannel = await newState.guild.channels
      .create({
        name: newState.member.user.username,
        type: ChannelType.GuildVoice,
        parent: config.customVC.parentId ?? newState.guild.channels.cache.get(config.customVC.channelId)?.parentId ?? null,
        permissionOverwrites: [
          {
            id: newState.guild.id,
            deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
          },
        ],
      })
      .catch((err) => logger.error(err, 'Could not create custom voice channel'));

    if (!newChannel) {
      return newState.member.voice.disconnect().catch((err) => logger.error(err, 'Could not disconnect user from custom vc creation channel'));
    }

    // Now we need to move the user to the new voice channel
    await newState.member.voice.setChannel(newChannel).catch((err) => logger.error(err, 'Could not move user to custom voice channel'));
    // Create a database entry for the custom vc for customization
    await createCustomVoiceChannel(newChannel.id, newState.guild.id, newState.member.id);
  },
});
