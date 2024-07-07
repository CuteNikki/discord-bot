import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  AttachmentBuilder,
  ChannelType,
  Colors,
  EmbedBuilder,
  PermissionFlagsBits,
  type FetchMessagesOptions,
} from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

export default new Command({
  module: ModuleType.MODERATION,
  data: {
    name: 'purge',
    description: 'Delete x amount of messages, by anyone, anywhere',
    dm_permission: false,
    default_member_permissions: `${PermissionFlagsBits.ManageMessages}`,
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
    options: [
      {
        name: 'amount',
        description: 'The amount of messages',
        type: ApplicationCommandOptionType.Integer,
        min_value: 1,
        max_value: 50,
        required: true,
      },
      {
        name: 'user',
        description: 'The user to delete messages of',
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: 'channel',
        description: 'The channel to delete messages in',
        type: ApplicationCommandOptionType.Channel,
        channel_types: [ChannelType.GuildText],
        required: false,
      },
      {
        name: 'before',
        description: 'Only delete sent messages before the given message link',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: 'after',
        description: 'Only delete sent messages after the given message link',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild() || !interaction.channel) return;
    await interaction.deferReply({ ephemeral: true });
    const lng = await client.getUserLanguage(interaction.user.id);

    const { options } = interaction;

    const amount = options.getInteger('amount', true);
    const user = options.getUser('user', false);
    const channel = options.getChannel('channel', false, [ChannelType.GuildText]) || interaction.channel;
    const beforeLink = options.getString('before', false);
    const afterLink = options.getString('after', false);

    let fetchOptions: FetchMessagesOptions = { limit: amount };

    if (beforeLink) {
      const splitLink = beforeLink.split('/');
      const messageId = splitLink[splitLink.length - 1];
      fetchOptions = { limit: amount, before: messageId };
    }
    if (afterLink) {
      const splitLink = afterLink.split('/');
      const messageId = splitLink[splitLink.length - 1];
      fetchOptions = { limit: amount, before: messageId };
    }

    let fetchedMessages = await channel.messages.fetch(fetchOptions).catch(() => {});
    if (!fetchedMessages) return interaction.editReply(i18next.t('purge.no_messages', { lng }));
    if (user) fetchedMessages = fetchedMessages.filter((msg) => msg.author.id === user.id);
    const deletedMessages = await channel.bulkDelete(fetchedMessages, true).catch(() => {});
    if (!deletedMessages) return interaction.editReply(i18next.t('purge.none_deleted', { lng }));

    interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setDescription(i18next.t('purge.success', { lng, deleted: deletedMessages.size, amount, channel: channel.toString() })),
      ],
      files: [
        new AttachmentBuilder(
          Buffer.from(
            `${deletedMessages
              .map(
                (message) =>
                  `Author: ${message?.author?.username} (${message?.author?.id})\nAttachments: ${message?.attachments
                    .map((attachment) => attachment.url)
                    .join('\n          ')}\nContent: ${message?.content}`
              )
              .join('\n\n')}`
          ),
          { name: 'message-bulk-delete.txt', description: 'List of all deleted messages with their author, content and attachments' }
        ),
      ],
    });
  },
});
