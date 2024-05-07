import { ChannelType, Colors, EmbedBuilder, Events, type MessageCreateOptions } from 'discord.js';

import { Event } from 'classes/event';

import { guildModel } from 'models/guild';
import { appendXP, getDataOrCreate, getLevelReward, randomXP } from 'utils/levels';

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
      !guildSettings.levels.enabled ||
      guildSettings.levels.ignoredChannels.includes(channelId) ||
      (guildSettings.levels.enabledChannels.length && !guildSettings.levels.enabledChannels.includes(channelId))
    )
      return;

    const identifier = { userId: author.id, guildId };

    const currentData = await getDataOrCreate(identifier, client);
    const newData = await appendXP(identifier, client, randomXP(), currentData);

    cooldowns.add(author.id);
    setTimeout(() => cooldowns.delete(author.id), 60000);

    if (currentData.level < newData.level) {
      const rewards = await getLevelReward(newData);

      const levelUpEmbed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setAuthor({ name: author.displayName, iconURL: author.displayAvatarURL() })
        .addFields({ name: 'Congratulations', value: `You are now level **${newData.level}**!` });

      if (rewards?.length) {
        const added = await member.roles.add(rewards.map((r) => r.roleId)).catch(() => {});
        if (added) levelUpEmbed.addFields({ name: 'New Role(s)', value: `${rewards.map((r) => `<@&${r.roleId}>`).join(' ')}` });
        else levelUpEmbed.addFields({ name: 'Could not add new Role(s)', value: `${rewards.map((r) => `<@&${r.roleId}>`).join(' ')}` });
      }

      const levelUpMessage: MessageCreateOptions = {
        content: author.toString(),
        embeds: [levelUpEmbed],
      };

      if (guildSettings.levels.channelId) {
        const channel = guild.channels.cache.get(guildSettings.levels.channelId);
        if (!channel || channel.type !== ChannelType.GuildText) return;
        channel.send(levelUpMessage);
      } else {
        const msg = await channel.send(levelUpMessage).catch(() => {});
        setTimeout(() => {
          if (msg) msg.delete().catch(() => {});
        }, 5000);
      }
    }
  },
});
