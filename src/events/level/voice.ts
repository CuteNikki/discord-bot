import { Collection, EmbedBuilder, Events, roleMention, type MessageCreateOptions, type VoiceBasedChannel } from 'discord.js';
import { t } from 'i18next';

import type { DiscordClient } from 'classes/client';
import { Event } from 'classes/event';

import { getGuildLanguage, getUserLanguage } from 'db/language';
import { appendXP, getLevel, getLevelConfig, getRandomExp, getRewardsForLevel } from 'db/level';

import { logger } from 'utils/logger';

import { AnnouncementType, type Multiplier } from 'types/level';

const connections = new Collection<string, { channelId: string; guildId: string; lastRan: number }>();

export default new Event({
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(client, oldState, newState) {
    if (!oldState.member || !newState.member || newState.member.user.bot) return;

    const level = (await getLevelConfig(newState.guild.id)) ?? { enabled: false, enabledChannels: [], ignoredChannels: [] };

    if (!level.enabled) return;

    if (newState.selfMute || newState.mute || newState.selfDeaf || newState.deaf) {
      logger.debug({ newState }, 'LevelVoiceStateUpdate: member muted/deafened');

      if (connections.has(newState.member.id)) {
        logger.debug({ newState }, 'LevelVoiceStateUpdate: removing member from collection');

        connections.delete(newState.member.id);
        return;
      }
      return;
    }

    if (!newState.channel) {
      logger.debug({ newState }, 'LevelVoiceStateUpdate: member not in a channel');

      if (connections.has(newState.member.id)) {
        logger.debug({ newState }, 'LevelVoiceStateUpdate: removing member from collection');

        connections.delete(newState.member.id);
      }
    }

    if (newState.channel && !newState.selfDeaf && !newState.selfMute && !newState.mute && !newState.deaf) {
      logger.debug({ newState }, 'LevelVoiceStateUpdate: member in channel without mute/deaf');

      if (!connections.has(newState.member.id)) {
        logger.debug({ newState }, 'LevelVoiceStateUpdate: adding member to collection');

        connections.set(newState.member.id, { channelId: newState.channel.id, guildId: newState.guild.id, lastRan: Date.now() });
      }

      const interval = setInterval(async () => await handleInterval(client), 10_000);

      if (!connections.size) {
        clearInterval(interval);
      }
    }
  }
});

async function handleInterval(client: DiscordClient) {
  for (const [userId, { channelId, guildId, lastRan }] of connections) {
    const NOW = Date.now();

    if (NOW - lastRan < 60_000) {
      logger.debug({ userId, channelId, guildId, lastRan }, 'LevelVoiceStateUpdate: skipping interval, member was last ran less than 60 seconds ago');
      return;
    }

    logger.debug({ userId, channelId, guildId }, 'LevelVoiceStateUpdate: running interval');

    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
      logger.debug({ userId, channelId, guildId }, 'LevelVoiceStateUpdate: guild not found');
      connections.delete(userId);
      return;
    }

    const channel = guild.channels.cache.get(channelId) as VoiceBasedChannel;

    if (!channel) {
      logger.debug({ userId, channelId, guildId }, 'LevelVoiceStateUpdate: channel not found');
      connections.delete(userId);
      return;
    }

    const member = channel.members.get(userId);

    if (!member) {
      logger.debug({ userId, channelId, guildId }, 'LevelVoiceStateUpdate: member not found');
      connections.delete(userId);
      return;
    }

    if (member.voice.deaf || member.voice.selfDeaf || member.voice.mute || member.voice.selfMute) {
      logger.debug({ userId, channelId, guildId }, 'LevelVoiceStateUpdate: member is deafened/muted');
      connections.delete(userId);
      return;
    }

    const level = (await getLevelConfig(guildId)) ?? {
      enabled: false,
      enabledChannels: [] as string[],
      ignoredChannels: [] as string[],
      multipliers: [] as Multiplier[],
      announcement: AnnouncementType.UserChannel
    };

    // We divide by 2 because levelling through voice is too strong without it
    let gainedXP = Math.floor(getRandomExp() / 2);

    for (const multiplier of level.multipliers) {
      if (!member?.roles.cache.has(multiplier.roleId)) {
        continue;
      }

      logger.debug({ userId, channelId, guildId, gainedXP, multiplier, xp: gainedXP * multiplier.multiplier }, 'LevelVoiceStateUpdate: applying multiplier');

      gainedXP *= multiplier.multiplier;
    }

    // Get current level before adding XP
    const currentLevel = await getLevel(userId, guildId, true);
    logger.debug({ userId, channelId, guildId, currentLevel }, 'LevelVoiceStateUpdate: current level');
    // Get updated level after adding XP
    const updatedLevel = await appendXP(userId, guildId, gainedXP);
    logger.debug({ userId, channelId, guildId, updatedLevel }, 'LevelVoiceStateUpdate: updated level');

    connections.set(userId, { channelId, guildId, lastRan: NOW });

    if (currentLevel.level === updatedLevel.level) {
      logger.debug({ userId, channelId, guildId }, 'LevelVoiceStateUpdate: level is the same, skipping level up');
      return;
    }

    // Now we know the user has levelled up, we can send a message

    // Get any rewards for the new level
    const rewards = await getRewardsForLevel(updatedLevel);

    if (rewards.length) {
      logger.debug({ userId, channelId, guildId, rewards }, 'LevelVoiceStateUpdate: found rewards');
    } else {
      logger.debug({ userId, channelId, guildId, rewards }, 'LevelVoiceStateUpdate: no rewards');
    }

    // Get the language of the user or guild depending on if the message is sent in the guild or to the user
    const lng = level.announcement === AnnouncementType.OtherChannel ? await getGuildLanguage(guildId) : await getUserLanguage(userId);

    const levelUpEmbed = new EmbedBuilder()
      .setColor(client.colors.level)
      .setAuthor({
        name: member?.displayName as string,
        iconURL: member?.displayAvatarURL()
      })
      .addFields({
        name: t('level.up.title', { lng }),
        value: t('level.up.description', { lng, level: updatedLevel.level })
      });

    // If there are rewards, we add the roles to the message and if they could not be added, we let the user know
    if (rewards?.length) {
      const added = await member?.roles.add(rewards.map((r) => r.roleId)).catch((err) => logger.debug({ err }, 'LevelVoiceStateUpdate: could not add role(s)'));

      if (added) {
        levelUpEmbed.addFields({
          name: t('level.up.title-roles', { lng }),
          value: rewards.map((r) => roleMention(r.roleId)).join(' ')
        });

        logger.debug({ userId, channelId, guildId, added }, 'LevelVoiceStateUpdate: added roles');
      } else {
        levelUpEmbed.addFields({
          name: t('level.up.title-roles-error', { lng }),
          value: rewards.map((r) => roleMention(r.roleId)).join(' ')
        });
      }
    }

    const levelUpMessage: MessageCreateOptions = {
      content: member?.toString(),
      embeds: [levelUpEmbed]
    };

    switch (level.announcement) {
      case AnnouncementType.UserChannel:
        {
          // Send the message to the current channel
          const msg = await channel?.send(levelUpMessage).catch((err) => logger.debug({ err }, 'LevelVoiceStateUpdate: could not send message'));

          // Delete the message after 5 seconds
          setTimeout(async () => {
            if (msg && msg.deletable) await msg.delete().catch((err) => logger.debug({ err }, 'LevelVoiceStateUpdate: could not delete message'));
          }, 5000);
        }
        break;
      case AnnouncementType.OtherChannel:
        {
          // Get the guilds announcement channel
          if (!level.channelId) return;
          const channel = guild.channels.cache.get(level.channelId);
          // If the channel is not sendable, return
          if (!channel?.isSendable()) return;

          // Send the message to the announcement channel
          await channel.send(levelUpMessage).catch((err) => logger.debug({ err }, 'LevelVoiceStateUpdate: could not send message'));
        }
        break;
      case AnnouncementType.PrivateMessage:
        {
          // We don't need to keep the message content as the user mention when the message is sent to DMs
          // Instead we let the user know from what guild the message came from
          levelUpMessage.content = t('level.up.message', { lng, guild: guild.name });
          // Send the message to the user
          await client.users.send(userId, levelUpMessage).catch((err) => logger.debug({ err, userId }, 'LevelVoiceStateUpdate: could not send DM'));
        }
        break;
    }

    logger.debug({ userId, channelId, guildId }, 'LevelVoiceStateUpdate: done with interval');
  }
}
