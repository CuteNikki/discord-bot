import { ChannelType, EmbedBuilder, Events, type ColorResolvable } from 'discord.js';

import { Event } from 'classes/event';
import { replacePlaceholders } from 'classes/custom-embed';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildMemberRemove,
  once: false,
  async execute(client, member) {
    const { guild, user } = member;
    if (user.bot) return;

    const config = await client.getGuildSettings(guild.id);

    if (!config.farewell.enabled || !config.farewell.channelId) return;
    const farewellChannel = await guild.channels.fetch(config.farewell.channelId);
    if (!farewellChannel || farewellChannel.type !== ChannelType.GuildText) return;

    const embedData = config.farewell.message.embed;

    await farewellChannel
      .send({
        content: replacePlaceholders(config.farewell.message.content ?? '', user, guild),
        embeds: [
          EmbedBuilder.from({
            title: replacePlaceholders(embedData.title ?? '', user, guild),
            author: {
              name: replacePlaceholders(embedData.author?.name ?? '', user, guild),
              icon_url: replacePlaceholders(embedData.author?.icon_url ?? '', user, guild),
              url: replacePlaceholders(embedData.author.url ?? '', user, guild),
            },
            description: replacePlaceholders(embedData.description ?? '', user, guild),
            fields: embedData.fields.map((field) => ({
              name: replacePlaceholders(field.name, user, guild),
              value: replacePlaceholders(field.value ?? '', user, guild),
            })),
            footer: {
              text: replacePlaceholders(embedData.footer?.text ?? '', user, guild),
              icon_url: replacePlaceholders(embedData.footer?.icon_url ?? '', user, guild),
            },
            image: {
              url: replacePlaceholders(embedData.image ?? '', user, guild),
            },
            thumbnail: {
              url: replacePlaceholders(embedData.thumbnail ?? '', user, guild),
            },
            url: replacePlaceholders(embedData.url ?? '', user, guild),
          }).setColor(embedData.color as ColorResolvable),
        ],
      })
      .catch((error) => logger.debug({ error }, 'Could not send farewell message'));
  },
});
