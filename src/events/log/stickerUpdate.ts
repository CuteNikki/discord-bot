import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildStickerUpdate,
  once: false,
  async execute(client, oldSticker, newSticker) {
    const guild = newSticker.guild;
    if (!guild) return;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.stickerUpdate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle('Sticker Update')
      .setThumbnail(newSticker.url)
      .addFields({ name: 'Sticker', value: `\`${newSticker.name}\` (${newSticker.id})` });

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newSticker.name !== oldSticker.name)
      embed.addFields({ name: 'Old Name', value: oldSticker.name, inline: true }, { name: 'New Name', value: newSticker.name, inline: true }, emptyField);
    if (newSticker.description !== oldSticker.description)
      embed.addFields(
        { name: 'Old Description', value: oldSticker.description || '/', inline: true },
        { name: 'New Description', value: newSticker.description || '/', inline: true },
        emptyField
      );
    if (newSticker.tags !== oldSticker.tags)
      embed.addFields(
        { name: 'Old Tags', value: oldSticker.tags || '/', inline: true },
        { name: 'New Tags', value: newSticker.tags || '/', inline: true },
        emptyField
      );

    await logChannel.send({ embeds: [embed] });
  },
});
