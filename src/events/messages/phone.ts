import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';
import { connectionModel } from '../../models/phone';

export default new Event({
  name: Events.MessageCreate,
  once: false,
  async execute(client, message) {
    const { guildId, channelId, channel, author, guild } = message;
    if (author.bot || !guild || !guildId || !channelId || !channel) return;

    const existingConnection = await connectionModel
      .findOne({
        $or: [{ channelIdOne: channelId }, { channelIdTwo: channelId }],
      })
      .lean()
      .exec();
    if (!existingConnection) return;

    const linkRegex =
      /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    if (linkRegex.test(message.content)) message.content = '*I tried to send a link!*';

    const res = await fetch('https://vector.profanity.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message.content }),
    });
    const response: { isProfanity: boolean; score: number } = await res.json();
    if (response.isProfanity) message.content = '*I said something bad!*';

    const connectedChannelId = existingConnection.channelIdOne === message.channel.id ? existingConnection.channelIdTwo : existingConnection.channelIdOne;

    const targetChannel = await client.channels.fetch(connectedChannelId).catch(() => {});
    if (!targetChannel || targetChannel.type !== ChannelType.GuildText) return;

    const embed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
      .setDescription(message.content || '/')
      .setTimestamp();
    await targetChannel.send({ embeds: [embed] }).catch(() => {});
  },
});
