import { EmbedBuilder, Events, PermissionsBitField } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

export default new Event({
  name: Events.MessageCreate,
  once: false,
  async execute(client, message) {
    const { client: readyClient, author } = message;
    if (message.author.bot || message.reference || !message.mentions.members || !message.mentions.members.has(readyClient.user.id)) return;
    if (message.member && !message.member.permissions.has(PermissionsBitField.Flags.UseApplicationCommands)) return;

    const lng = await client.getUserLanguage(author.id);

    message.reply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({ name: author.displayName, iconURL: author.displayAvatarURL() })
          .setDescription([t('mentioned.responding', { lng }), t('mentioned.commands', { lng })].join('\n'))
          .setFooter({ text: readyClient.user.username, iconURL: readyClient.user.displayAvatarURL() }),
      ],
    });
  },
});
