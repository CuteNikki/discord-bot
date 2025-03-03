import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  Message,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ColorResolvable,
  type CommandInteraction,
} from 'discord.js';
import logger from 'utility/logger';

/**
 * The structure of an embed
 */
type EmbedStructure = {
  title?: string;
  description?: string;
  color?: string;
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
  footer?: {
    text: string;
    iconURL?: string;
  };
  thumbnail?: string;
  image?: string;
  author?: {
    name: string;
    iconURL?: string;
    url?: string;
  };
};

/**
 * The structure of a message
 */
type MessageStructure = {
  content?: string;
  embeds?: EmbedStructure[];
};

/**
 * The props for the message builder
 */
type MessageBuilderProps = {
  message?: MessageStructure;
  interaction: CommandInteraction;
};

/**
 * A class used to build custom embeds.
 */
export class MessageBuilder {
  private message: MessageStructure;
  private interaction: CommandInteraction;

  constructor(props: MessageBuilderProps) {
    this.interaction = props.interaction;
    this.message = props.message ?? {};

    this.sendMessage();
  }

  /**
   * The start of the message builder, sending a message with the content and embeds
   */
  private async sendMessage(): Promise<void> {
    let content: { content: string | undefined; embeds?: EmbedBuilder[] } = {
      content: this.replacePlaceholders(this.message.content),
      embeds: this.getEmbeds(),
    };
    if (!content.content && !content.embeds?.length) content = { content: 'No content or embeds provided.' };

    const message = await this.interaction.editReply({ ...content, components: this.getComponents() }).catch(() => null);

    if (!message) return;

    this.collectInteractions(message);
  }

  private collectInteractions(message: Message): void {
    const buttonInteractionCollector = message.createMessageComponentCollector({ componentType: ComponentType.Button, idle: 60_000 });

    buttonInteractionCollector.on('collect', (buttonInteraction) => this.handleCollect(buttonInteraction, message));
    buttonInteractionCollector.on('end', () => this.handleTimeout(message));
  }

  private async handleCollect(buttonInteraction: ButtonInteraction, message: Message): Promise<void> {
    if (buttonInteraction.user.id !== this.interaction.user.id) {
      await buttonInteraction.reply({ content: 'You are not allowed to interact with this message.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    switch (buttonInteraction.customId) {
      case 'builder_content':
        this.handleContentCollect(buttonInteraction, message);
        break;
      case 'builder_embed_add':
        this.handleEmbedAddCollect(buttonInteraction, message);
        break;
      case 'builder_embed_remove':
        this.handleEmbedRemoveCollect(buttonInteraction, message);
        break;
      // case 'builder_title':
      //   this.handleTitleCollect(buttonInteraction, message);
      //   break;
      // case 'builder_description':
      //   this.handleDescriptionCollect(buttonInteraction, message);
      //   break;
      // case 'builder_color':
      //   this.handleColorCollect(buttonInteraction, message);
      //   break;
      // case 'builder_field_add':
      //   this.handleFieldAddCollect(buttonInteraction, message);
      //   break;
      // case 'builder_field_remove':
      //   this.handleFieldRemoveCollect(buttonInteraction, message);
      //   break;
      // case 'builder_footer':
      //   this.handleFooterCollect(buttonInteraction, message);
      //   break;
      // case 'builder_thumbnail':
      //   this.handleThumbnailCollect(buttonInteraction, message);
      //   break;
      // case 'builder_image':
      //   this.handleImageCollect(buttonInteraction, message);
      //   break;
      // case 'builder_author':
      //   this.handleAuthorCollect(buttonInteraction, message);
      //   break;
      default:
        await buttonInteraction.reply({ content: 'Invalid button interaction.', flags: [MessageFlags.Ephemeral] });
        break;
    }
  }

  /**
   * Handle the content button interaction
   * @param buttonInteraction the button interaction
   * @param message the message to edit
   */
  private async handleContentCollect(buttonInteraction: ButtonInteraction, message: Message): Promise<void> {
    await buttonInteraction
      .showModal(
        new ModalBuilder()
          .setCustomId('modal_builder_content')
          .setTitle('Content')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId('modal_builder_content_input')
                .setLabel('Content')
                .setPlaceholder('Enter the content you want to set.')
                .setValue(this.message.content ?? '')
                .setStyle(TextInputStyle.Paragraph),
            ),
          ),
      )
      .catch((error) => logger.debug({ err: error }, 'Failed to show modal'));
    const modalInteraction = await buttonInteraction
      .awaitModalSubmit({
        time: 60_000,
        idle: 60_000,
        filter: (modalInteraction) => modalInteraction.customId === 'modal_builder_content',
      })
      .catch((error) => logger.debug({ err: error }, 'Failed to await modal submission'));
    if (!modalInteraction) return;

    await modalInteraction.deferUpdate().catch((error) => logger.debug({ err: error }, 'Failed to defer update'));

    const content = modalInteraction.fields.getTextInputValue('modal_builder_content_input');

    this.message.content = content;
    await this.updateMessage(message);
  }

  /**
   * Handle the embed add button interaction
   * @param buttonInteraction the button interaction
   * @param message the message to edit
   */
  private async handleEmbedAddCollect(buttonInteraction: ButtonInteraction, message: Message): Promise<void> {
    await buttonInteraction.deferUpdate().catch((error) => logger.debug({ err: error }, 'Failed to defer update'));

    this.message.embeds = this.message.embeds ?? [];
    this.message.embeds.push({});

    await this.updateMessage(message);
  }

  /**
   * Handle the embed remove button interaction
   * @param buttonInteraction the button interaction
   * @param message the message to edit
   */
  private async handleEmbedRemoveCollect(buttonInteraction: ButtonInteraction, message: Message): Promise<void> {
    if (!this.message.embeds || !this.message.embeds.length) {
      await buttonInteraction.reply({ content: 'There are no embeds to remove.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    await buttonInteraction.deferUpdate().catch((error) => logger.debug({ err: error }, 'Failed to defer update'));

    this.message.embeds.pop();

    await this.updateMessage(message);
  }

  /**
   * Handle the timeout/end of the collector
   * @param message The message to edit
   */
  private async handleTimeout(message: Message) {
    await message
      .edit({ content: 'The session has ended. Please re-run the command to start over.', components: [] })
      .catch((error) => logger.debug({ err: error }, 'Failed to remove components'));
  }

  private async updateMessage(message: Message) {
    let content: { content: string | undefined; embeds?: EmbedBuilder[] } = {
      content: this.replacePlaceholders(this.message.content),
      embeds: this.getEmbeds(),
    };
    if (!content.content && !content.embeds?.length) content = { content: 'No content or embeds provided.', embeds: [] };

    await message.edit({ ...content, components: this.getComponents() }).catch((error) => logger.debug({ err: error }, 'Failed to update message'));
  }

  /**
   * Get the components for the message builder
   * @returns The components
   */
  private getComponents(): ActionRowBuilder<ButtonBuilder>[] {
    const contentButton = new ButtonBuilder().setCustomId('builder_content').setLabel('Message').setStyle(ButtonStyle.Primary);
    const addEmbedButton = new ButtonBuilder().setCustomId('builder_embed_add').setLabel('Add Embed').setEmoji('➕').setStyle(ButtonStyle.Success);
    const removeEmbedButton = new ButtonBuilder().setCustomId('builder_embed_remove').setLabel('Remove Embed').setEmoji('➖').setStyle(ButtonStyle.Danger);
    const titleButton = new ButtonBuilder().setCustomId('builder_title').setLabel('Title').setStyle(ButtonStyle.Secondary);
    const descriptionButton = new ButtonBuilder().setCustomId('builder_description').setLabel('Description').setStyle(ButtonStyle.Secondary);
    const colorButton = new ButtonBuilder().setCustomId('builder_color').setLabel('Color').setStyle(ButtonStyle.Secondary);
    const addFieldButton = new ButtonBuilder().setCustomId('builder_field_add').setLabel('Add field').setEmoji('➕').setStyle(ButtonStyle.Success);
    const removeFieldButton = new ButtonBuilder().setCustomId('builder_field_remove').setLabel('Remove field').setEmoji('➖').setStyle(ButtonStyle.Danger);
    const footerButton = new ButtonBuilder().setCustomId('builder_footer').setLabel('Footer').setStyle(ButtonStyle.Secondary);
    const thumbnailButton = new ButtonBuilder().setCustomId('builder_thumbnail').setLabel('Thumbnail').setStyle(ButtonStyle.Secondary);
    const imageButton = new ButtonBuilder().setCustomId('builder_image').setLabel('Image').setStyle(ButtonStyle.Secondary);
    const authorButton = new ButtonBuilder().setCustomId('builder_author').setLabel('Author').setStyle(ButtonStyle.Secondary);

    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(contentButton, addEmbedButton, removeEmbedButton),
      new ActionRowBuilder<ButtonBuilder>().addComponents(titleButton, descriptionButton),
      new ActionRowBuilder<ButtonBuilder>().addComponents(authorButton, footerButton),
      new ActionRowBuilder<ButtonBuilder>().addComponents(thumbnailButton, imageButton, colorButton),
      new ActionRowBuilder<ButtonBuilder>().addComponents(addFieldButton, removeFieldButton),
    ];
  }

  /**
   * Converts the embeds in to EmbedBuilders
   * @returns The EmbedBuilders
   */
  private getEmbeds(): EmbedBuilder[] {
    const embeds: EmbedBuilder[] = [];

    // If there are no embeds, return an empty array
    if (!this.message.embeds) return embeds;

    for (const embed of this.message.embeds) {
      const embedBuilder = new EmbedBuilder();
      if (embed.color) embedBuilder.setColor(embed.color as ColorResolvable);
      if (embed.title) embedBuilder.setTitle(this.replacePlaceholders(embed.title));
      if (embed.description) embedBuilder.setDescription(this.replacePlaceholders(embed.description));
      if (embed.thumbnail) embedBuilder.setThumbnail(this.replacePlaceholders(embed.thumbnail));
      if (embed.image) embedBuilder.setImage(this.replacePlaceholders(embed.image));
      if (embed.fields)
        embedBuilder.addFields(
          embed.fields.map((field) => ({ name: this.replacePlaceholders(field.name), value: this.replacePlaceholders(field.value), inline: field.inline })),
        );
      if (embed.author)
        embedBuilder.setAuthor({
          name: this.replacePlaceholders(embed.author.name),
          iconURL: this.replacePlaceholders(embed.author.iconURL),
          url: embed.author.url,
        });
      if (embed.footer) embedBuilder.setFooter({ text: this.replacePlaceholders(embed.footer.text), iconURL: this.replacePlaceholders(embed.footer.iconURL) });
      if (!embed.title && !embed.description && !embed.fields && !embed.author?.name) embedBuilder.setDescription('** **');
      embeds.push(embedBuilder);
    }

    return embeds;
  }

  /**
   * Replace placeholders in a string
   * @param content The content to replace placeholders in
   * @returns The content with placeholders replaced
   */
  private replacePlaceholders(content: string = '') {
    return content
      .replaceAll('{user.id}', this.interaction.user.id)
      .replaceAll('{user.mention}', this.interaction.user.toString())
      .replaceAll('{user.displayname}', this.interaction.user.displayName)
      .replaceAll('{user.username}', this.interaction.user.username)
      .replaceAll('{user.avatar}', this.interaction.user.displayAvatarURL())
      .replaceAll('{user}', this.interaction.user.toString())
      .replaceAll('{guild.id}', this.interaction.guild!.id)
      .replaceAll('{guild.name}', this.interaction.guild!.name)
      .replaceAll('{guild.icon}', this.interaction.guild!.iconURL() ?? '')
      .replaceAll('{guild}', this.interaction.guild!.toString());
  }
}
