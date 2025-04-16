import {
  ApplicationIntegrationType,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  InteractionContextType,
  Message,
  SlashCommandBuilder,
} from 'discord.js';

import { deleteMessageBuilder, getMessageBuilder, getMessageBuilders, updateOrCreateMessageBuilder } from 'database/message-builder';

import { Command } from 'classes/command';
import { MessageBuilder, type EmbedStructure, type MessageStructure } from 'classes/message-builder';

import logger from 'utility/logger';

const safeEditReply = async (interaction: ChatInputCommandInteraction, content: string) => {
  await interaction
    .editReply({
      content,
      embeds: [],
      components: [],
    })
    .catch((error) => logger.debug({ err: error }, 'Failed to send message'));
};

const safeFetchMessage = async (client: Client, channelId: string, messageId?: string | null): Promise<Message | null> => {
  const channel = client.channels.cache.get(channelId);
  if (!channel?.isTextBased() || !messageId) return null;

  return await channel.messages.fetch(messageId).catch((error) => {
    logger.error({ err: error }, 'Failed to fetch message');
    return null;
  });
};

const setupBuilderListeners = (builderInstance: MessageBuilder, interaction: ChatInputCommandInteraction, message: Message | null) => {
  builderInstance.addListener('submit', async (submitted: MessageStructure) => {
    if (message) {
      await message
        .edit({
          content: builderInstance.replacePlaceholders(submitted.content),
          embeds: submitted.embed ? [builderInstance.getEmbed(submitted.embed)] : [],
        })
        .catch((error) => logger.error({ err: error }, 'Failed to edit message'));
    }

    const updatedBuilder = await updateOrCreateMessageBuilder({
      ...submitted,
      channelId: interaction.channelId,
      guildId: interaction.guildId ?? undefined,
      messageId: message?.id,
      userId: interaction.user.id,
    });

    await safeEditReply(
      interaction,
      `Changes have been saved! ID: \`${updatedBuilder.id}\` ${message ? 'Message was updated.' : 'Message could not be edited.'}`,
    );
  });

  builderInstance.addListener('delete', async (submitted: MessageStructure) => {
    if (message) {
      await message.delete().catch((error) => logger.error({ err: error }, 'Failed to delete message'));
    }

    if (submitted.id) {
      await deleteMessageBuilder(submitted.id).catch((error) => logger.error({ err: error }, 'Failed to delete message builder'));
    }

    await safeEditReply(interaction, 'Custom Message deleted!');
  });

  builderInstance.addListener('timeout', async (submitted: MessageStructure) => {
    const updatedBuilder = await updateOrCreateMessageBuilder({
      ...submitted,
      channelId: interaction.channelId,
      guildId: interaction.guildId ?? undefined,
      messageId: message?.id,
      userId: interaction.user.id,
    });

    await safeEditReply(interaction, `The session has ended. Your changes have been saved: \`${updatedBuilder.id}\``);
  });
};

export default new Command({
  builder: new SlashCommandBuilder()
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .setName('builder')
    .setDescription('Create a custom message')
    .addSubcommand((cmd) => cmd.setName('list').setDescription('List all custom messages'))
    .addSubcommand((cmd) =>
      cmd
        .setName('create')
        .setDescription('Create a custom message')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('The channel to send the message in')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('edit')
        .setDescription('Edit a custom message')
        .addStringOption((option) =>
          option.setName('id').setDescription('The ID of the custom message').setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('delete')
        .setDescription('Delete a custom message')
        .addStringOption((option) =>
          option.setName('id').setDescription('The ID of the custom message').setRequired(true).setAutocomplete(true),
        ),
    ),
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused();

    if (focusedOption.name === 'id') {
      const builders = await getMessageBuilders(interaction.user.id);
      const filtered = builders.filter((b) => b.id.includes(focusedOption.value));
      await interaction.respond(filtered.map((b) => ({ name: b.id, value: b.id })).slice(0, 25));
    }
  },
  async execute(interaction) {
    await interaction.deferReply();
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      const builders = await getMessageBuilders(interaction.user.id);
      if (!builders.length) {
        return await safeEditReply(interaction, 'No custom messages found');
      }

      const list = builders
        .map((b) => `\`${b.id}\`: [Jump](https://discord.com/channels/${b.guildId ? `${b.guildId}/` : ''}${b.channelId}/${b.messageId})`)
        .join('\n');
      return await interaction.editReply({ content: `Custom Messages:\n${list}` });
    }

    const id = interaction.options.getString('id', false);

    if (subcommand === 'edit') {
      const builder = await getMessageBuilder(id!);
      if (!builder) return await safeEditReply(interaction, 'Message Builder not found');

      const message = await safeFetchMessage(interaction.client, builder.channelId, builder.messageId);
      const builderInstance = new MessageBuilder({
        interaction,
        message: { id: id!, content: builder.content ?? undefined, embed: builder.embed as EmbedStructure },
      });

      setupBuilderListeners(builderInstance, interaction, message);
      return;
    }

    if (subcommand === 'delete') {
      const builder = await getMessageBuilder(id!);
      if (!builder || builder.userId !== interaction.user.id) return await safeEditReply(interaction, 'Message Builder not found');

      const message = await safeFetchMessage(interaction.client, builder.channelId, builder.messageId);
      if (message) await message.delete().catch((e) => logger.error({ err: e }, 'Failed to delete message'));

      await deleteMessageBuilder(builder.id).catch((e) => logger.error({ err: e }, 'Failed to delete message builder'));
      return await safeEditReply(interaction, 'Custom Message deleted!');
    }

    if (subcommand === 'create') {
      const channel = interaction.options.getChannel('channel', true, [ChannelType.GuildText, ChannelType.GuildAnnouncement]);

      const builder = new MessageBuilder({ interaction });

      builder.addListener('submit', async (submitted: MessageStructure) => {
        const message = await channel.send(submitted).catch((e) => {
          logger.error({ err: e }, 'Failed to send message');
          return null;
        });

        const saved = await updateOrCreateMessageBuilder({
          ...submitted,
          channelId: interaction.channelId,
          guildId: interaction.guildId ?? undefined,
          messageId: message?.id,
          userId: interaction.user.id,
        });

        await safeEditReply(interaction, `Changes have been saved! ID: \`${saved.id}\` ${message ? '' : 'Message could not be sent.'}`);
      });

      builder.addListener('delete', async () => await safeEditReply(interaction, 'Custom Message deleted!'));

      builder.addListener('timeout', async (submitted: MessageStructure) => {
        const saved = await updateOrCreateMessageBuilder({
          ...submitted,
          channelId: interaction.channelId,
          guildId: interaction.guildId ?? undefined,
          userId: interaction.user.id,
        });

        await safeEditReply(interaction, `The session has ended. Your changes have been saved: \`${saved.id}\``);
      });
    }
  },
});
