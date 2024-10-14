import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { getLevelConfig } from 'db/level';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.ClientReady,
  once: true,
  async execute(client, readyClient) {
    logger.info(`[${client.cluster.id}] Ready as ${readyClient.user.username}#${readyClient.user.discriminator}`);

    // Fetching and setting custom emojis
    await readyClient.application.emojis.fetch();

    for (const emoji of readyClient.application.emojis.cache.values()) {
      client.customEmojis[emoji.name as keyof typeof client.customEmojis] = emoji.toString();
    }

    // Checking if members are in voice channels for levelling

    const guilds = client.guilds.cache.map((g) => g);

    // logger.debug(`VoiceLevelReady: checking if members are in voice channels for levelling (${guilds.length} guilds)`);

    for (const guild of guilds) {
      const members = guild.members.cache.map((m) => m).filter((mem) => !mem.user.bot && mem.voice.channelId);

      const levelConfig = (await getLevelConfig(guild.id)) ?? { enabled: false, enabledChannels: [], ignoredChannels: [] };

      // logger.debug({ levelConfig }, `VoiceLevelReady: checking guild (${guild.name} | ${guild.id})}`);

      if (!levelConfig.enabled) {
        continue;
      }

      for (const member of members) {
        // logger.debug(`VoiceLevelReady: checking member (${member.displayName} | ${member.id})`);

        if (!member.voice.channelId) {
          // logger.debug(`VoiceLevelReady: user is not in voice channel (${member.displayName} | ${member.id})`);
          continue;
        }

        const channel = guild.channels.cache.get(member.voice.channelId);

        if (!channel?.isVoiceBased()) {
          // logger.debug(`VoiceLevelReady: channel not found or not voice based (${channel?.id})`);
          continue;
        }

        if (levelConfig.enabledChannels.length && !levelConfig.enabledChannels.includes(member.voice.channelId)) {
          // logger.debug(`VoiceLevelReady: channel is not enabled (${channel.id})`);
          continue;
        }

        if (levelConfig.ignoredChannels.length && levelConfig.ignoredChannels.includes(member.voice.channelId)) {
          // logger.debug(`VoiceLevelReady: channel is ignored (${channel.id})`);
          continue;
        }

        if (member.voice.deaf || member.voice.selfDeaf || member.voice.mute || member.voice.selfMute) {
          // logger.debug(`VoiceLevelReady: member is deafened or muted (${member.displayName} | ${member.id})`);
          continue;
        }

        if (channel.members.size <= 1) {
          // logger.debug(`VoiceLevelReady: channel has only one member (${channel.id})`);
          continue;
        }

        // logger.debug(`VoiceLevelReady: adding member to collection (${member.displayName} | ${member.id}) (${channel.name} | ${channel.id})`);
        client.voiceLevels.set(member.id, { channelId: member.voice.channelId, guildId: guild.id, lastRan: Date.now() });
      }
    }
  }
});
