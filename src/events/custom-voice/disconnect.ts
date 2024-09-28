import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { deleteCustomVoiceChannel, getCustomVoiceChannel } from 'db/custom-voice';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(_client, oldState, newState) {
    if (!oldState.channel || !newState.member) return;

    const config = await getCustomVoiceChannel(oldState.channel.id);

    // If the channel is not a custom voice channel, we don't need to do anything
    if (!config || oldState.channel.id !== config.channelId) return;

    // If the channel is not owned by the user or if the channel is not empty, we don't need to do anything
    if (config.ownerId !== newState.member.id || oldState.channel?.members.size) return;

    // Delete the custom voice channel
    await deleteCustomVoiceChannel(oldState.channel.id);
    await oldState.channel.delete().catch((err) => logger.error(err, 'Could not delete custom voice channel'));
  },
});
