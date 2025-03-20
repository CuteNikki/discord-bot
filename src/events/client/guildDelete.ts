import { Colors, EmbedBuilder, Events, time, TimestampStyles, userMention, WebhookClient } from 'discord.js';

import { Event } from 'classes/event';

import { keys } from 'constants/keys';

import { incrementGuildsLeft } from 'db/client';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildDelete,
  once: false,
  async execute(client, guild) {
    await incrementGuildsLeft(keys.DISCORD_BOT_ID);

    logger.debug(guild, 'Left a Guild');

    if (!keys.DEVELOPER_GUILD_FEED_WEBHOOK || keys.DEVELOPER_GUILD_FEED_WEBHOOK === 'optional') {
      return;
    }

    const webhook = new WebhookClient({ url: keys.DEVELOPER_GUILD_FEED_WEBHOOK });

    webhook.send({
      username: `${client.user?.displayName ?? keys.DISCORD_BOT_ID} | Guild Delete`,
      avatarURL: client.user?.displayAvatarURL(),
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setAuthor({ name: guild.name, iconURL: guild.iconURL() ?? undefined })
          .setDescription(guild.description)
          .addFields(
            {
              name: 'Owner',
              value: userMention(guild.ownerId)
            },
            {
              name: 'Created at',
              value: `${time(Math.floor(guild.createdTimestamp / 1000), TimestampStyles.ShortDate)} | ${time(Math.floor(guild.createdTimestamp / 1000), TimestampStyles.RelativeTime)}`
            },
            {
              name: 'Members',
              value: [
                `Total: ${guild.memberCount}`,
                `Bots: ${guild.members.cache.filter((mem) => mem.user.bot).size}`,
                `Humans: ${guild.members.cache.filter((mem) => !mem.user.bot).size}`
              ].join('\n')
            },
            {
              name: 'Vanity',
              value: guild.vanityURLCode ?? '/'
            }
          )
          .setFooter({ text: `ID: ${guild.id}` })
          .setTimestamp()
      ]
    });
  }
});
