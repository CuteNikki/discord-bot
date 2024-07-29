import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

export default new Event({
  name: Events.MessageUpdate,
  once: false,
  async execute(client, oldMessage, newMessage) {
    const guild = newMessage.guild;
    if (!guild || !newMessage.author || newMessage.author.bot) return;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.messageUpdate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!config.log.enabled || !logChannel || logChannel.type !== ChannelType.GuildText) return;

    const lng = config.language;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.messageUpdate.title', { lng }))
      .addFields({
        name: t('log.messageUpdate.author', { lng }),
        value: `${newMessage.author.toString()} (\`${newMessage.author.username}\` | ${newMessage.author.id})`,
      })
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newMessage.content !== oldMessage.content)
      embed.addFields(
        {
          name: t('log.messageUpdate.old_content', { lng }),
          value: oldMessage.content ? (oldMessage.content.length > 950 ? oldMessage.content.slice(0, 950) + '...' : oldMessage.content) : '/',
          inline: true,
        },
        {
          name: t('log.messageUpdate.new_content', { lng }),
          value: newMessage.content ? (newMessage.content.length > 950 ? newMessage.content.slice(0, 950) + '...' : newMessage.content) : '/',
          inline: true,
        },
        emptyField,
      );
    if ((newMessage.pinned ?? false) !== (oldMessage.pinned ?? false))
      embed.addFields(
        {
          name: t('log.messageUpdate.old_pinned', { lng }),
          value: `${oldMessage.pinned ?? false}`,
          inline: true,
        },
        {
          name: t('log.messageUpdate.new_pinned', { lng }),
          value: `${newMessage.pinned ?? false}`,
          inline: true,
        },
        emptyField,
      );
    if (newMessage.attachments.size !== oldMessage.attachments.size) {
      const oldAttachments = oldMessage.attachments.map((a) => a);
      const newAttachments = newMessage.attachments.map((a) => a);

      embed.addFields({
        name: t('log.messageUpdate.deleted_attachments', { lng }),
        value: oldAttachments
          .filter((attachment) => newAttachments.map((att) => att.id).includes(attachment.id))
          .map((attachment) => attachment.url)
          .join('\n')
          .slice(0, 1000),
      });
    }

    const embedData = embed.toJSON();
    if (!embedData.fields?.length || embedData.fields.length > 25) return;

    await logChannel.send({
      embeds: [embed],
    });
  },
});
