import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { getLevelConfig } from 'db/level';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(client, oldState, newState) {
    if (!oldState.member || !newState.member || newState.member.user.bot) {
      return;
    }

    if (!newState.channelId) {
      if (client.voiceLevels.has(newState.member.id)) {
        logger.debug(`VoiceLevelState: member left channel, removing from collection (${newState.member.displayName} | ${newState.member.id})`);
        client.voiceLevels.delete(newState.member.id);
      } else {
        logger.debug(`VoiceLevelState: member left channel (${newState.member.displayName} | ${newState.member.id})`);
      }
      return;
    }

    logger.debug({ oldState, newState }, 'VoiceLevelState: state updated');

    const levelConfig = (await getLevelConfig(newState.guild.id)) ?? { enabled: false, enabledChannels: [], ignoredChannels: [] };

    logger.debug({ levelConfig }, `VoiceLevelState: level config (${newState.guild.name} | ${newState.guild.id})`);

    if (
      !levelConfig.enabled ||
      (newState.channelId && levelConfig.enabledChannels.length && !levelConfig.enabledChannels.includes(newState.channelId)) ||
      (newState.channelId && levelConfig.ignoredChannels.length && levelConfig.ignoredChannels.includes(newState.channelId))
    ) {
      logger.debug(`VoiceLevelState: channel is not enabled or ignored (${newState.channelId})`);
      return;
    }

    if (newState.selfDeaf || newState.deaf || newState.selfMute || newState.mute) {
      if (client.voiceLevels.has(newState.member.id)) {
        logger.debug(`VoiceLevelState: member is deafened or muted, removing from collection (${newState.member.displayName} | ${newState.member.id})`);
        client.voiceLevels.delete(newState.member.id);
      } else {
        logger.debug(`VoiceLevelState: member is deafened or muted, not adding to collection (${newState.member.displayName} | ${newState.member.id})`);
      }
      return;
    }

    if (newState.channel) {
      if (newState.channel.members.size <= 1) {
        if (client.voiceLevels.has(newState.member.id)) {
          logger.debug(
            {},
            `VoiceLevelState: channel has only one member, removing from collection (${newState.member.displayName} | ${newState.member.id}) (${newState.channel.name} | ${newState.channel.id})`
          );
          client.voiceLevels.delete(newState.member.id);
        }
        return;
      }

      if (!client.voiceLevels.has(newState.member.id)) {
        logger.debug(
          {},
          `VoiceLevelState: member joined channel, adding to collection (${newState.member.displayName} | ${newState.member.id}) (${newState.channel.name} | ${newState.channel.id})`
        );
        client.voiceLevels.set(newState.member.id, { channelId: newState.channel.id, guildId: newState.guild.id, lastRan: Date.now() });
      }
    }
  }
});
