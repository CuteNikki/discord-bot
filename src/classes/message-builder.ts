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
 * The custom ids for the message builder
 */
export enum MessageBuilderCustomIds {
  ContentButton = 'builder_button_content',
  ContentModal = 'builder_modal_content',
  ContentInput = 'builder_input_content',
  TitleButton = 'builder_button_title',
  TitleModal = 'builder_modal_title',
  TitleInput = 'builder_input_title',
  TitleUrlInput = 'builder_input_url',
  DescriptionButton = 'builder_button_description',
  DescriptionModal = 'builder_modal_description',
  DescriptionInput = 'builder_input_description',
  ColorButton = 'builder_button_color',
  ColorModal = 'builder_modal_color',
  ColorInput = 'builder_input_color',
  FieldAddButton = 'builder_button_field_add',
  FieldAddModal = 'builder_modal_field_add',
  FieldAddNameInput = 'builder_input_field_add_name',
  FieldAddValueInput = 'builder_input_field_add_value',
  FieldAddInlineInput = 'builder_input_field_add_inline',
  FieldRemoveButton = 'builder_button_field_remove',
  FieldRemoveModal = 'builder_modal_field_remove',
  FieldRemoveIndexInput = 'builder_input_field_remove_index',
  AuthorButton = 'builder_button_author',
  AuthorModal = 'builder_modal_author',
  AuthorNameInput = 'builder_input_author_name',
  AuthorIconInput = 'builder_input_author_icon',
  AuthorUrlInput = 'builder_input_author_url',
  FooterButton = 'builder_button_footer',
  FooterModal = 'builder_modal_footer',
  FooterTextInput = 'builder_input_footer_text',
  FooterIconInput = 'builder_input_footer_icon',
  ThumbnailButton = 'builder_button_thumbnail',
  ThumbnailModal = 'builder_modal_thumbnail',
  ThumbnailInput = 'builder_input_thumbnail',
  ImageButton = 'builder_button_image',
  ImageModal = 'builder_modal_image',
  ImageInput = 'builder_input_image',
}

/**
 * The structure of an embed
 */
type EmbedStructure = {
  title?: string;
  url?: string;
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
  embed?: EmbedStructure;
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
      embeds: this.getEmbed() ? [this.getEmbed() as EmbedBuilder] : [],
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
      case MessageBuilderCustomIds.ContentButton:
        this.handleContentCollect(buttonInteraction, message);
        break;
      case MessageBuilderCustomIds.TitleButton:
        this.handleTitleCollect(buttonInteraction, message);
        break;
      case MessageBuilderCustomIds.DescriptionButton:
        this.handleDescriptionCollect(buttonInteraction, message);
        break;
      case MessageBuilderCustomIds.ColorButton:
        this.handleColorCollect(buttonInteraction, message);
        break;
      case MessageBuilderCustomIds.FieldAddButton:
        this.handleFieldAddCollect(buttonInteraction, message);
        break;
      case MessageBuilderCustomIds.FieldRemoveButton:
        this.handleFieldRemoveCollect(buttonInteraction, message);
        break;
      case MessageBuilderCustomIds.AuthorButton:
        this.handleAuthorCollect(buttonInteraction, message);
        break;
      case MessageBuilderCustomIds.FooterButton:
        this.handleFooterCollect(buttonInteraction, message);
        break;
      case MessageBuilderCustomIds.ThumbnailButton:
        this.handleThumbnailCollect(buttonInteraction, message);
        break;
      case MessageBuilderCustomIds.ImageButton:
        this.handleImageCollect(buttonInteraction, message);
        break;
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
          .setCustomId(MessageBuilderCustomIds.ContentModal)
          .setTitle('Content')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.ContentInput)
                .setLabel('Content')
                .setPlaceholder('Enter the content you want to set.')
                .setValue(this.message.content ?? '')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false),
            ),
          ),
      )
      .catch((error) => logger.debug({ err: error }, 'Failed to show modal'));
    const modalInteraction = await buttonInteraction
      .awaitModalSubmit({
        time: 60_000,
        idle: 60_000,
        filter: (modalInteraction) => modalInteraction.customId === MessageBuilderCustomIds.ContentModal,
      })
      .catch((error) => logger.debug({ err: error }, 'Failed to await modal submission'));
    if (!modalInteraction) return;

    await modalInteraction.deferUpdate().catch((error) => logger.debug({ err: error }, 'Failed to defer update'));

    const content = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.ContentInput);

    this.message.content = content;
    await this.updateMessage(message);
  }

  /**
   * Handle the title button interaction
   * @param buttonInteraction the button interaction
   * @param message the message to edit
   */
  private async handleTitleCollect(buttonInteraction: ButtonInteraction, message: Message): Promise<void> {
    await buttonInteraction
      .showModal(
        new ModalBuilder()
          .setCustomId(MessageBuilderCustomIds.TitleModal)
          .setTitle('Title')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.TitleInput)
                .setLabel('Title')
                .setPlaceholder('Enter the title you want to set.')
                .setValue(this.message.embed?.title ?? '')
                .setStyle(TextInputStyle.Short)
                .setRequired(false),
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.TitleUrlInput)
                .setLabel('URL')
                .setPlaceholder('Enter the URL you want to set.')
                .setValue(this.message.embed?.url ?? '')
                .setStyle(TextInputStyle.Short)
                .setRequired(false),
            ),
          ),
      )
      .catch((error) => logger.debug({ err: error }, 'Failed to show modal'));
    const modalInteraction = await buttonInteraction
      .awaitModalSubmit({
        time: 60_000,
        idle: 60_000,
        filter: (modalInteraction) => modalInteraction.customId === MessageBuilderCustomIds.TitleModal,
      })
      .catch((error) => logger.debug({ err: error }, 'Failed to await modal submission'));
    if (!modalInteraction) return;

    await modalInteraction.deferUpdate().catch((error) => logger.debug({ err: error }, 'Failed to defer update'));

    const title = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.TitleInput);
    const url = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.TitleUrlInput);

    if (!this.message.embed) this.message.embed = {};
    this.message.embed.title = title;
    this.message.embed.url = url;
    await this.updateMessage(message);
  }

  /**
   * Handle the color button interaction
   * @param buttonInteraction the button interaction
   * @param message the message to edit
   */
  private async handleColorCollect(buttonInteraction: ButtonInteraction, message: Message): Promise<void> {
    await buttonInteraction
      .showModal(
        new ModalBuilder()
          .setCustomId(MessageBuilderCustomIds.ColorModal)
          .setTitle('Color')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.ColorInput)
                .setLabel('Color')
                .setPlaceholder('Enter the color you want to set.')
                .setValue(this.message.embed?.color ?? '')
                .setStyle(TextInputStyle.Short)
                .setRequired(false),
            ),
          ),
      )
      .catch((error) => logger.debug({ err: error }, 'Failed to show modal'));
    const modalInteraction = await buttonInteraction
      .awaitModalSubmit({
        time: 60_000,
        idle: 60_000,
        filter: (modalInteraction) => modalInteraction.customId === MessageBuilderCustomIds.ColorModal,
      })
      .catch((error) => logger.debug({ err: error }, 'Failed to await modal submission'));
    if (!modalInteraction) return;

    const color = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.ColorInput);

    const isValidHex = /^#([0-9A-F]{6})$/i.test(color);

    if (!isValidHex) {
      await modalInteraction.reply({ content: 'Invalid color code. Please provide a valid hex code.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    await modalInteraction.deferUpdate().catch((error) => logger.debug({ err: error }, 'Failed to defer update'));

    if (!this.message.embed) this.message.embed = {};
    this.message.embed.color = color;
    await this.updateMessage(message);
  }

  /**
   * Handle the description button interaction
   * @param buttonInteraction the button interaction
   * @param message the message to edit
   */
  private async handleDescriptionCollect(buttonInteraction: ButtonInteraction, message: Message): Promise<void> {
    await buttonInteraction
      .showModal(
        new ModalBuilder()
          .setCustomId(MessageBuilderCustomIds.DescriptionModal)
          .setTitle('Description')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.DescriptionInput)
                .setLabel('Description')
                .setPlaceholder('Enter the description you want to set.')
                .setValue(this.message.embed?.description ?? '')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false),
            ),
          ),
      )
      .catch((error) => logger.debug({ err: error }, 'Failed to show modal'));
    const modalInteraction = await buttonInteraction
      .awaitModalSubmit({
        time: 60_000,
        idle: 60_000,
        filter: (modalInteraction) => modalInteraction.customId === MessageBuilderCustomIds.DescriptionModal,
      })
      .catch((error) => logger.debug({ err: error }, 'Failed to await modal submission'));
    if (!modalInteraction) return;

    await modalInteraction.deferUpdate().catch((error) => logger.debug({ err: error }, 'Failed to defer update'));

    const description = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.DescriptionInput);

    if (!this.message.embed) this.message.embed = {};
    this.message.embed.description = description;
    await this.updateMessage(message);
  }

  /**
   * Handle the field add button interaction
   * @param buttonInteraction the button interaction
   * @param message the message to edit
   */
  private async handleFieldAddCollect(buttonInteraction: ButtonInteraction, message: Message): Promise<void> {
    if (this.message.embed?.fields?.length === 25) {
      await buttonInteraction.reply({ content: 'You can only have a maximum of 25 fields.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    await buttonInteraction
      .showModal(
        new ModalBuilder()
          .setCustomId(MessageBuilderCustomIds.FieldAddModal)
          .setTitle('Add Field')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.FieldAddNameInput)
                .setLabel('Name')
                .setPlaceholder('Enter the name of the field you want to add.')
                .setStyle(TextInputStyle.Short)
                .setRequired(false),
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.FieldAddValueInput)
                .setLabel('Value')
                .setPlaceholder('Enter the value of the field you want to add.')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false),
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.FieldAddInlineInput)
                .setLabel('Inline')
                .setPlaceholder('true/false - Enter whether the field should be inline.')
                .setStyle(TextInputStyle.Short)
                .setRequired(false),
            ),
          ),
      )
      .catch((error) => logger.debug({ err: error }, 'Failed to show modal'));
    const modalInteraction = await buttonInteraction
      .awaitModalSubmit({
        time: 60_000,
        idle: 60_000,
        filter: (modalInteraction) => modalInteraction.customId === MessageBuilderCustomIds.FieldAddModal,
      })
      .catch((error) => logger.debug({ err: error }, 'Failed to await modal submission'));
    if (!modalInteraction) return;

    const name = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.FieldAddNameInput);
    const value = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.FieldAddValueInput);
    const inline = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.FieldAddInlineInput);

    if (!name || !value) {
      await modalInteraction.reply({ content: 'Please provide a name and value for the field.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    if (inline?.length && inline !== 'true' && inline !== 'false') {
      await modalInteraction.reply({ content: 'Invalid inline value. Please provide a valid boolean.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    await modalInteraction.deferUpdate().catch((error) => logger.debug({ err: error }, 'Failed to defer update'));

    if (!this.message.embed) this.message.embed = {};
    if (!this.message.embed.fields) this.message.embed.fields = [];
    this.message.embed.fields.push({ name, value, inline: inline === 'true' });
    await this.updateMessage(message);
  }

  /**
   * Handle the field remove button interaction
   * @param buttonInteraction the button interaction
   * @param message the message to edit
   */
  private async handleFieldRemoveCollect(buttonInteraction: ButtonInteraction, message: Message): Promise<void> {
    if (!this.message.embed || !this.message.embed.fields || !this.message.embed.fields.length) {
      await buttonInteraction.reply({ content: 'No fields to remove.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    await buttonInteraction
      .showModal(
        new ModalBuilder()
          .setCustomId(MessageBuilderCustomIds.FieldRemoveModal)
          .setTitle('Remove Field')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.FieldRemoveIndexInput)
                .setLabel('Index')
                .setPlaceholder(
                  `Available indexes: ${this.message.embed.fields.map((field, index) => `${index + 1}. ${field.name}`).join(', ')}`,
                )
                .setStyle(TextInputStyle.Short)
                .setRequired(false),
            ),
          ),
      )
      .catch((error) => logger.debug({ err: error }, 'Failed to show modal'));
    const modalInteraction = await buttonInteraction
      .awaitModalSubmit({
        time: 60_000,
        idle: 60_000,
        filter: (modalInteraction) => modalInteraction.customId === MessageBuilderCustomIds.FieldRemoveModal,
      })
      .catch((error) => logger.debug({ err: error }, 'Failed to await modal submission'));
    if (!modalInteraction) return;

    const index = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.FieldRemoveIndexInput);

    const fieldIndex = parseInt(index);
    if (isNaN(fieldIndex) || fieldIndex < 0 || fieldIndex > this.message.embed.fields.length) {
      await modalInteraction.reply({ content: 'Invalid field index. Please provide a valid index.', flags: [MessageFlags.Ephemeral] });
      return;
    }

    await modalInteraction.deferUpdate().catch((error) => logger.debug({ err: error }, 'Failed to defer update'));

    this.message.embed.fields.splice(fieldIndex - 1, 1);
    if (!this.message.embed.fields.length) delete this.message.embed.fields;
    await this.updateMessage(message);
  }

  /**
   * Handle the author button interaction
   * @param buttonInteraction the button interaction
   * @param message the message to edit
   */
  private async handleAuthorCollect(buttonInteraction: ButtonInteraction, message: Message): Promise<void> {
    await buttonInteraction
      .showModal(
        new ModalBuilder()
          .setCustomId(MessageBuilderCustomIds.AuthorModal)
          .setTitle('Author')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.AuthorNameInput)
                .setLabel('Name')
                .setPlaceholder('Enter the name you want to set.')
                .setValue(this.message.embed?.author?.name ?? '')
                .setStyle(TextInputStyle.Short)
                .setRequired(false),
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.AuthorIconInput)
                .setLabel('Icon')
                .setPlaceholder('Enter the icon URL you want to set.')
                .setValue(this.message.embed?.author?.iconURL ?? '')
                .setStyle(TextInputStyle.Short)
                .setRequired(false),
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.AuthorUrlInput)
                .setLabel('URL')
                .setPlaceholder('Enter the URL you want to set.')
                .setValue(this.message.embed?.author?.url ?? '')
                .setStyle(TextInputStyle.Short)
                .setRequired(false),
            ),
          ),
      )
      .catch((error) => logger.debug({ err: error }, 'Failed to show modal'));
    const modalInteraction = await buttonInteraction
      .awaitModalSubmit({
        time: 60_000,
        idle: 60_000,
        filter: (modalInteraction) => modalInteraction.customId === MessageBuilderCustomIds.AuthorModal,
      })
      .catch((error) => logger.debug({ err: error }, 'Failed to await modal submission'));
    if (!modalInteraction) return;

    await modalInteraction.deferUpdate().catch((error) => logger.debug({ err: error }, 'Failed to defer update'));

    const name = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.AuthorNameInput);
    const icon = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.AuthorIconInput);
    const url = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.AuthorUrlInput);

    if (!this.message.embed) this.message.embed = {};
    this.message.embed.author = { name, iconURL: icon, url };
    await this.updateMessage(message);
  }

  /**
   * Handle the footer button interaction
   * @param buttonInteraction the button interaction
   * @param message the message to edit
   */
  private async handleFooterCollect(buttonInteraction: ButtonInteraction, message: Message): Promise<void> {
    await buttonInteraction
      .showModal(
        new ModalBuilder()
          .setCustomId(MessageBuilderCustomIds.FooterModal)
          .setTitle('Footer')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.FooterTextInput)
                .setLabel('Text')
                .setPlaceholder('Enter the text you want to set.')
                .setValue(this.message.embed?.footer?.text ?? '')
                .setStyle(TextInputStyle.Short)
                .setRequired(false),
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.FooterIconInput)
                .setLabel('Icon')
                .setPlaceholder('Enter the icon URL you want to set.')
                .setValue(this.message.embed?.footer?.iconURL ?? '')
                .setStyle(TextInputStyle.Short)
                .setRequired(false),
            ),
          ),
      )
      .catch((error) => logger.debug({ err: error }, 'Failed to show modal'));
    const modalInteraction = await buttonInteraction
      .awaitModalSubmit({
        time: 60_000,
        idle: 60_000,
        filter: (modalInteraction) => modalInteraction.customId === MessageBuilderCustomIds.FooterModal,
      })
      .catch((error) => logger.debug({ err: error }, 'Failed to await modal submission'));
    if (!modalInteraction) return;

    await modalInteraction.deferUpdate().catch((error) => logger.debug({ err: error }, 'Failed to defer update'));

    const text = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.FooterTextInput);
    const icon = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.FooterIconInput);

    if (!this.message.embed) this.message.embed = {};
    this.message.embed.footer = { text, iconURL: icon };
    await this.updateMessage(message);
  }

  /**
   * Handle the thumbnail button interaction
   * @param buttonInteraction the button interaction
   * @param message the message to edit
   */
  private async handleThumbnailCollect(buttonInteraction: ButtonInteraction, message: Message): Promise<void> {
    await buttonInteraction
      .showModal(
        new ModalBuilder()
          .setCustomId(MessageBuilderCustomIds.ThumbnailModal)
          .setTitle('Thumbnail')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.ThumbnailInput)
                .setLabel('Thumbnail')
                .setPlaceholder('Enter the thumbnail URL you want to set.')
                .setValue(this.message.embed?.thumbnail ?? '')
                .setStyle(TextInputStyle.Short)
                .setRequired(false),
            ),
          ),
      )
      .catch((error) => logger.debug({ err: error }, 'Failed to show modal'));
    const modalInteraction = await buttonInteraction
      .awaitModalSubmit({
        time: 60_000,
        idle: 60_000,
        filter: (modalInteraction) => modalInteraction.customId === MessageBuilderCustomIds.ThumbnailModal,
      })
      .catch((error) => logger.debug({ err: error }, 'Failed to await modal submission'));
    if (!modalInteraction) return;

    await modalInteraction.deferUpdate().catch((error) => logger.debug({ err: error }, 'Failed to defer update'));

    const thumbnail = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.ThumbnailInput);

    if (!this.message.embed) this.message.embed = {};
    this.message.embed.thumbnail = thumbnail;
    await this.updateMessage(message);
  }

  /**
   * Handle the image button interaction
   * @param buttonInteraction the button interaction
   * @param message the message to edit
   */
  private async handleImageCollect(buttonInteraction: ButtonInteraction, message: Message): Promise<void> {
    await buttonInteraction
      .showModal(
        new ModalBuilder()
          .setCustomId(MessageBuilderCustomIds.ImageModal)
          .setTitle('Image')
          .addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(MessageBuilderCustomIds.ImageInput)
                .setLabel('Image')
                .setPlaceholder('Enter the image URL you want to set.')
                .setValue(this.message.embed?.image ?? '')
                .setStyle(TextInputStyle.Short)
                .setRequired(false),
            ),
          ),
      )
      .catch((error) => logger.debug({ err: error }, 'Failed to show modal'));
    const modalInteraction = await buttonInteraction
      .awaitModalSubmit({
        time: 60_000,
        idle: 60_000,
        filter: (modalInteraction) => modalInteraction.customId === MessageBuilderCustomIds.ImageModal,
      })
      .catch((error) => logger.debug({ err: error }, 'Failed to await modal submission'));
    if (!modalInteraction) return;

    await modalInteraction.deferUpdate().catch((error) => logger.debug({ err: error }, 'Failed to defer update'));

    const image = modalInteraction.fields.getTextInputValue(MessageBuilderCustomIds.ImageInput);

    if (!this.message.embed) this.message.embed = {};
    this.message.embed.image = image;
    await this.updateMessage(message);
  }

  /**
   * Handle the timeout/end of the collector
   * @param message The message to edit
   */
  private async handleTimeout(message: Message) {
    await message
      .edit({ content: 'The session has ended. Please re-run the command to start over.', components: [], embeds: [] })
      .catch((error) => logger.debug({ err: error }, 'Failed to remove components'));
  }

  private async updateMessage(message: Message) {
    let content: { content: string | undefined; embeds?: EmbedBuilder[] } = {
      content: this.replacePlaceholders(this.message.content),
      embeds: this.getEmbed() ? [this.getEmbed() as EmbedBuilder] : [],
    };
    if (!content.content && !content.embeds?.length) content = { content: 'No content or embeds provided.', embeds: [] };

    await message
      .edit({ ...content, components: this.getComponents() })
      .catch((error) => logger.debug({ err: error }, 'Failed to update message'));
  }

  /**
   * Get the components for the message builder
   * @returns The components
   */
  private getComponents(): ActionRowBuilder<ButtonBuilder>[] {
    const contentButton = new ButtonBuilder()
      .setCustomId(MessageBuilderCustomIds.ContentButton)
      .setLabel('Message')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Secondary);
    const titleButton = new ButtonBuilder()
      .setCustomId(MessageBuilderCustomIds.TitleButton)
      .setLabel('Title')
      .setEmoji('📑')
      .setStyle(ButtonStyle.Secondary);
    const descriptionButton = new ButtonBuilder()
      .setCustomId(MessageBuilderCustomIds.DescriptionButton)
      .setEmoji('📖')
      .setLabel('Description')
      .setStyle(ButtonStyle.Secondary);
    const colorButton = new ButtonBuilder()
      .setCustomId(MessageBuilderCustomIds.ColorButton)
      .setLabel('Color')
      .setEmoji('🎨')
      .setStyle(ButtonStyle.Secondary);
    const addFieldButton = new ButtonBuilder()
      .setCustomId(MessageBuilderCustomIds.FieldAddButton)
      .setLabel('Add field')
      .setEmoji('➕')
      .setStyle(ButtonStyle.Success);
    const removeFieldButton = new ButtonBuilder()
      .setCustomId(MessageBuilderCustomIds.FieldRemoveButton)
      .setLabel('Remove field')
      .setEmoji('➖')
      .setStyle(ButtonStyle.Danger);
    const thumbnailButton = new ButtonBuilder()
      .setCustomId(MessageBuilderCustomIds.ThumbnailButton)
      .setLabel('Thumbnail')
      .setEmoji('🖼️')
      .setStyle(ButtonStyle.Secondary);
    const imageButton = new ButtonBuilder()
      .setCustomId(MessageBuilderCustomIds.ImageButton)
      .setLabel('Image')
      .setEmoji('📷')
      .setStyle(ButtonStyle.Secondary);
    const footerButton = new ButtonBuilder()
      .setCustomId(MessageBuilderCustomIds.FooterButton)
      .setLabel('Footer')
      .setEmoji('📎')
      .setStyle(ButtonStyle.Secondary);
    const authorButton = new ButtonBuilder()
      .setCustomId(MessageBuilderCustomIds.AuthorButton)
      .setLabel('Author')
      .setEmoji('🏷️')
      .setStyle(ButtonStyle.Secondary);

    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(contentButton, titleButton, descriptionButton),
      new ActionRowBuilder<ButtonBuilder>().addComponents(colorButton, thumbnailButton, imageButton),
      new ActionRowBuilder<ButtonBuilder>().addComponents(authorButton, footerButton),
      new ActionRowBuilder<ButtonBuilder>().addComponents(addFieldButton, removeFieldButton),
    ];
  }

  /**
   * Converts the embeds in to EmbedBuilders
   * @returns The EmbedBuilders
   */
  private getEmbed(): EmbedBuilder | null {
    const embed = this.message.embed;

    if (!embed) return null;

    const embedBuilder = new EmbedBuilder();
    if (embed.color) embedBuilder.setColor(embed.color as ColorResolvable);
    if (embed.title) embedBuilder.setTitle(this.replacePlaceholders(embed.title));
    if (embed.url) embedBuilder.setURL(this.replacePlaceholders(embed.url));
    if (embed.description) embedBuilder.setDescription(this.replacePlaceholders(embed.description));
    if (embed.thumbnail) embedBuilder.setThumbnail(this.replacePlaceholders(embed.thumbnail));
    if (embed.image) embedBuilder.setImage(this.replacePlaceholders(embed.image));
    if (embed.fields)
      embedBuilder.addFields(
        embed.fields.map((field) => ({
          name: this.replacePlaceholders(field.name),
          value: this.replacePlaceholders(field.value),
          inline: field.inline,
        })),
      );
    if (embed.author)
      embedBuilder.setAuthor({
        name: this.replacePlaceholders(embed.author.name),
        iconURL: this.replacePlaceholders(embed.author.iconURL),
        url: this.replacePlaceholders(embed.author.url),
      });
    if (embed.footer)
      embedBuilder.setFooter({
        text: this.replacePlaceholders(embed.footer.text),
        iconURL: this.replacePlaceholders(embed.footer.iconURL),
      });
    if (!embed.title && !embed.description && !embed.fields && !embed.author?.name) embedBuilder.setDescription('** **');

    return embedBuilder;
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
