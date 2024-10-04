import { EmbedBuilder, Events, PermissionsBitField } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getUserLanguage } from 'db/user';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageCreate,
  once: false,
  async execute(_client, message) {
    const { client: readyClient, author } = message;

    if (message.author.bot || message.reference || !message.mentions.members || !message.mentions.members.has(readyClient.user.id)) return;
    if (message.member && !message.member.permissions.has(PermissionsBitField.Flags.UseApplicationCommands)) return;

    const lng = await getUserLanguage(author.id);

    await message
      .reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({ name: author.displayName, iconURL: author.displayAvatarURL() })
            .setDescription([t('mentioned.responding', { lng }), t('mentioned.commands', { lng })].join('\n'))
            .setFooter({ text: readyClient.user.username, iconURL: readyClient.user.displayAvatarURL() })
        ]
      })
      .catch((err) => logger.debug({ err }, 'Could not send message'));
  }
});
