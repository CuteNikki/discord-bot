import { ChannelType, Colors, EmbedBuilder, Events, type MessageCreateOptions } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { AnnouncementType } from 'models/guild';

import { appendXP, getDataOrCreate, getLevelRewards, randomXP } from 'utils/level';
import { logger } from 'utils/logger';

const cooldowns = new Set();

export default new Event({
  name: Events.MessageCreate,
  once: false,
  async execute(client, message) {
    const { guildId, channelId, author, guild, member, channel } = message;
    if (author.bot || cooldowns.has(author.id) || !member || !guild || !guildId) return;

    const guildSettings = await client.getGuildSettings(guildId);

    if (
      !guildSettings ||
      !guildSettings.level.enabled ||
      guildSettings.level.ignoredChannels.includes(channelId) ||
      (guildSettings.level.enabledChannels.length && !guildSettings.level.enabledChannels.includes(channelId))
    )
      return;

    const identifier = { userId: author.id, guildId };

    const currentData = await getDataOrCreate(identifier, client);
    const newData = await appendXP(identifier, client, randomXP(), currentData);

    cooldowns.add(author.id);
    setTimeout(() => cooldowns.delete(author.id), 60000);

    if (currentData.level < newData.level) {
      const rewards = await getLevelRewards(client, newData);
      const lng =
        guildSettings.level.announcement === AnnouncementType.OtherChannel ? await client.getGuildLanguage(guild.id) : await client.getUserLanguage(author.id);

      const levelUpEmbed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setAuthor({
          name: author.displayName,
          iconURL: author.displayAvatarURL(),
        })
        .addFields({
          name: t('level.up.title', { lng }),
          value: t('level.up.description', { lng, level: newData.level }),
        });

      if (rewards?.length) {
        const added = await member.roles.add(rewards.map((r) => r.roleId)).catch((error) => logger.debug({ error }, 'Could not add role(s)'));
        if (added)
          levelUpEmbed.addFields({
            name: t('level.up.title_roles', { lng }),
            value: rewards.map((r) => `<@&${r.roleId}>`).join(' '),
          });
        else
          levelUpEmbed.addFields({
            name: t('level.up.title_roles_error', { lng }),
            value: rewards.map((r) => `<@&${r.roleId}>`).join(' '),
          });
      }

      const levelUpMessage: MessageCreateOptions = {
        content: author.toString(),
        embeds: [levelUpEmbed],
      };

      switch (guildSettings.level.announcement) {
        case AnnouncementType.UserChannel:
          {
            const msg = await channel.send(levelUpMessage).catch((error) => logger.debug({ error }, 'Could not send message'));
            setTimeout(() => {
              if (msg && msg.deletable) msg.delete().catch((error) => logger.debug({ error }, 'Could not delete message'));
            }, 5000);
          }
          break;
        case AnnouncementType.OtherChannel:
          {
            if (!guildSettings.level.channelId) return;
            const channel = guild.channels.cache.get(guildSettings.level.channelId);
            if (!channel || channel.type !== ChannelType.GuildText) return;
            channel.send(levelUpMessage).catch((error) => logger.debug({ error }, 'Could not send message'));
          }
          break;
        case AnnouncementType.PrivateMessage:
          {
            levelUpMessage.content = t('level.up.message', {
              lng,
              guild: guild.name,
            });
            levelUpEmbed.setFields({
              name: t('level.up.title', { lng }),
              value: t('level.up.description', { lng }),
            });
            if (rewards?.length)
              levelUpEmbed.addFields({
                name: t('level.up.title_roles', { lng, count: rewards.length }),
                value: rewards.map((r) => `<@&${r.roleId}>`).join(' '),
              });
            client.users.send(author.id, levelUpMessage).catch((error) => logger.debug({ error, userId: author.id }, 'Could not send DM'));
          }
          break;
      }
    }
  },
});
