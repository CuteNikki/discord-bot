import { EmbedBuilder, Events, roleMention, type MessageCreateOptions } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuild } from 'db/guild';
import { getGuildLanguage, getUserLanguage } from 'db/language';
import { appendXP, getLevel, getRandomExp, getRewardsForLevel } from 'db/level';

import { AnnouncementType } from 'types/guild';

import { logger } from 'utils/logger';

const cooldowns = new Set();

export default new Event({
  name: Events.MessageCreate,
  once: false,
  async execute(client, message) {
    if (!message.inGuild() || message.author.bot || cooldowns.has(message.author.id)) {
      return;
    }

    const { channel, author: user, guild, member } = message;

    // Check if levelling is disabled, or if the channel is ignored and return
    const guildSettings = await getGuild(guild.id);
    if (
      !guildSettings ||
      !guildSettings.level.enabled ||
      guildSettings.level.ignoredChannels.includes(channel.id) ||
      (guildSettings.level.enabledChannels.length && !guildSettings.level.enabledChannels.includes(channel.id))
    ) {
      return;
    }

    // Get current level before adding XP
    const currentLevel = await getLevel(user.id, guild.id, true);
    // Get updated level after adding XP
    const updatedLevel = await appendXP(user.id, guild.id, getRandomExp());

    // After we added XP, we add the user to a cooldown
    // We do not want the user to level up by spamming
    cooldowns.add(user.id);
    // After 60 seconds, we remove the user from the cooldown
    setTimeout(() => cooldowns.delete(user.id), 60_000);

    // If the level is the same, return
    if (currentLevel.level === updatedLevel.level) {
      return;
    }

    // Now we know the user has levelled up, we can send a message

    // Get any rewards for the new level
    const rewards = await getRewardsForLevel(updatedLevel);

    // Get the language of the user or guild depending on if the message is sent in the guild or to the user
    const lng = guildSettings.level.announcement === AnnouncementType.OtherChannel ? await getGuildLanguage(guild.id) : await getUserLanguage(user.id);

    const levelUpEmbed = new EmbedBuilder()
      .setColor(client.colors.level)
      .setAuthor({
        name: user.displayName,
        iconURL: user.displayAvatarURL()
      })
      .addFields({
        name: t('level.up.title', { lng }),
        value: t('level.up.description', { lng, level: updatedLevel.level })
      });

    // If there are rewards, we add the roles to the message and if they could not be added, we let the user know
    if (rewards?.length && member) {
      const added = await member.roles.add(rewards.map((r) => r.roleId)).catch((err) => logger.debug({ err }, 'Could not add role(s)'));

      if (added) {
        levelUpEmbed.addFields({
          name: t('level.up.title-roles', { lng }),
          value: rewards.map((r) => roleMention(r.roleId)).join(' ')
        });
      } else {
        levelUpEmbed.addFields({
          name: t('level.up.title-roles-error', { lng }),
          value: rewards.map((r) => roleMention(r.roleId)).join(' ')
        });
      }
    }

    const levelUpMessage: MessageCreateOptions = {
      content: user.toString(),
      embeds: [levelUpEmbed]
    };

    switch (guildSettings.level.announcement) {
      case AnnouncementType.UserChannel:
        {
          // Send the message to the current channel
          const msg = await channel.send(levelUpMessage).catch((err) => logger.debug({ err }, 'Could not send message'));

          // Delete the message after 5 seconds
          setTimeout(async () => {
            if (msg && msg.deletable) await msg.delete().catch((err) => logger.debug({ err }, 'Could not delete message'));
          }, 5000);
        }
        break;
      case AnnouncementType.OtherChannel:
        {
          // Get the guilds announcement channel
          if (!guildSettings.level.channelId) return;
          const channel = guild.channels.cache.get(guildSettings.level.channelId);
          // If the channel is not sendable, return
          if (!channel?.isSendable()) return;

          // Send the message to the announcement channel
          await channel.send(levelUpMessage).catch((err) => logger.debug({ err }, 'Could not send message'));
        }
        break;
      case AnnouncementType.PrivateMessage:
        {
          // We don't need to keep the message content as the user mention when the message is sent to DMs
          // Instead we let the user know from what guild the message came from
          levelUpMessage.content = t('level.up.message', { lng, guild: guild.name });
          // Send the message to the user
          await client.users.send(user.id, levelUpMessage).catch((err) => logger.debug({ err, userId: user.id }, 'Could not send DM'));
        }
        break;
    }
  }
});
