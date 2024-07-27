import {
  ApplicationIntegrationType,
  AttachmentBuilder,
  ChannelType,
  Colors,
  EmbedBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type FetchMessagesOptions,
} from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.Moderation,
  botPermissions: ['ManageMessages', 'SendMessages'],
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete x amount of messages, by anyone, anywhere')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addIntegerOption((option) => option.setName('amount').setDescription('The amount of messages').setMinValue(1).setMaxValue(50).setRequired(true))
    .addUserOption((option) => option.setName('user').setDescription('The user to delete messages of').setRequired(false))
    .addChannelOption((option) =>
      option.setName('channel').setDescription('The channel to delete messages in').addChannelTypes(ChannelType.GuildText).setRequired(false)
    )
    .addStringOption((option) => option.setName('before').setDescription('Only delete sent messages before the given message link').setRequired(false))
    .addStringOption((option) => option.setName('after').setDescription('Only delete sent messages after the given message link').setRequired(false)),
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
      fetchOptions = { limit: amount, after: messageId };
    }

    let fetchedMessages = await channel.messages.fetch(fetchOptions).catch((error) => logger.debug({ error, channelId: channel.id }, 'Could not fetch messages'));
    if (!fetchedMessages) return interaction.editReply(t('purge.no_messages', { lng }));
    if (user) fetchedMessages = fetchedMessages.filter((msg) => msg.author.id === user.id);
    const deletedMessages = await channel
      .bulkDelete(fetchedMessages, true)
      .catch((error) => logger.debug({ error, channelId: channel.id, messages: fetchedMessages }, 'Could not bulk delete messages'));
    if (!deletedMessages) return interaction.editReply(t('purge.none_deleted', { lng }));

    interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setDescription(t('purge.success', { lng, deleted: deletedMessages.size, amount, channel: channel.toString() })),
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
