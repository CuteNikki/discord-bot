import { ChannelType, Colors, EmbedBuilder, Events, type MessageCreateOptions } from 'discord.js';
import i18next from 'i18next';

import { Event } from 'classes/event';

import { AnnouncementType, guildModel } from 'models/guild';
import { appendXP, getDataOrCreate, getLevelRewards, randomXP } from 'utils/level';

const cooldowns = new Set();

export default new Event({
  name: Events.MessageCreate,
  once: false,
  async execute(client, message) {
    if (!client.usable) return;

    const { guildId, channelId, author, guild, member, channel } = message;
    const guildSettings = await guildModel.findOne({ guildId }).lean().exec();

    if (
      author.bot ||
      cooldowns.has(author.id) ||
      !member ||
      !guild ||
      !guildId ||
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
      const rewards = await getLevelRewards(newData);

      const levelUpEmbed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setAuthor({ name: author.displayName, iconURL: author.displayAvatarURL() })
        .addFields({ name: 'Congratulations', value: `You are now level **${newData.level}**!` });

      if (rewards?.length) {
        const added = await member.roles.add(rewards.map((r) => r.roleId)).catch(() => {});
        if (added) levelUpEmbed.addFields({ name: 'New Role(s)', value: rewards.map((r) => `<@&${r.roleId}>`).join(' ') });
        else levelUpEmbed.addFields({ name: 'Could not add new Role(s)', value: rewards.map((r) => `<@&${r.roleId}>`).join('\n') });
      }

      const levelUpMessage: MessageCreateOptions = {
        content: author.toString(),
        embeds: [levelUpEmbed],
      };

      switch (guildSettings.level.announcement) {
        case AnnouncementType.USER_CHANNEL:
          {
            const msg = await channel.send(levelUpMessage).catch(() => {});
            setTimeout(() => {
              if (msg) msg.delete().catch(() => {});
            }, 5000);
          }
          break;
        case AnnouncementType.OTHER_CHANNEL:
          {
            if (!guildSettings.level.channelId) return;
            const channel = guild.channels.cache.get(guildSettings.level.channelId);
            if (!channel || channel.type !== ChannelType.GuildText) return;
            channel.send(levelUpMessage).catch(() => {});
          }
          break;
        case AnnouncementType.PRIVATE_MESSAGE:
          {
            const lng = await client.getLanguage(author.id);

            levelUpMessage.content = i18next.t('level.dm.message', { lng, guild: guild.name });
            levelUpEmbed.setFields({ name: i18next.t('level.dm.title', { lng }), value: i18next.t('level.dm.description', { lng }) });
            if (rewards?.length)
              levelUpEmbed.addFields({
                name: i18next.t('level.dm.title_roles', { lng, count: rewards.length }),
                value: rewards.map((r) => `<@&${r.roleId}>`).join(' '),
              });
            client.users.send(author.id, levelUpMessage).catch(() => {});
          }
          break;
      }
    }
  },
});
