import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ChatInputCommandInteraction,
  type ColorResolvable,
  type Guild,
  type InteractionEditReplyOptions,
  type User
} from 'discord.js';
import events from 'events';
import { t } from 'i18next';

import type { DiscordClient } from 'classes/client';

import { getUserLanguage } from 'db/language';

import type { Embed, Message } from 'types/guild';

import { logger } from 'utils/logger';

export class CustomEmbedBuilder extends events {
  private message: Message = {
    content: null,
    embed: {
      color: '#1e1f22',
      description: undefined,
      image: undefined,
      thumbnail: undefined,
      title: undefined,
      url: undefined,
      author: {
        name: undefined,
        url: undefined,
        icon_url: undefined
      },
      footer: {
        text: undefined,
        icon_url: undefined
      },
      fields: []
    }
  };

  constructor(
    public options: {
      interaction: ChatInputCommandInteraction<'cached'>;
      client: DiscordClient;
      message?: Message;
    }
  ) {
    super();
    if (options.message) this.message = options.message;
    this.sendEmbedWithButtons();
  }

  private async sendEmbedWithButtons() {
    const interaction = this.options.interaction;
    const user = interaction.user;
    const lng = await getUserLanguage(user.id);
    const guild = interaction.guild;

    let embed = new EmbedBuilder().setDescription('** **');
    if (!isEmptyEmbed(this.message.embed)) embed = getEmbed(user, guild, this.message.embed);

    const message = await interaction
      .editReply({
        content: replacePlaceholders(this.message.content ?? '', user, guild),
        embeds: [embed],
        components: this.getButtons(lng, false)
      })
      .catch((err) => logger.debug({ err }, 'Could not edit message'));
    if (!message) return;

    const collector = message.createMessageComponentCollector({
      idle: 60 * 10 * 1000, // 10 minutes
      componentType: ComponentType.Button
    });

    collector.on('end', (_, reason) => {
      if (reason === 'idle')
        interaction
          .editReply({
            content: null,
            embeds: [embed],
            components: this.getButtons(lng, true)
          })
          .catch((err) => logger.debug({ err }, 'Could not edit message'));
    });

    collector.on('collect', async (buttonInteraction) => {
      switch (buttonInteraction.customId.split('_')[1]) {
        case 'message':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom-embed.editing-embed', { lng }))
                  .setCustomId('modal-custom-message')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-custom-message')
                        .setLabel(t('custom-embed.input.message', { lng }))
                        .setStyle(TextInputStyle.Paragraph)
                        .setMaxLength(2000)
                        .setRequired(false)
                        .setValue(this.message.content ?? '')
                    )
                  )
              )
              .catch((err) => logger.debug({ err }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'modal-custom-message',
                time: 60 * 10 * 1000
              })
              .catch((err) => logger.debug({ err }, 'Could not await modal submit'));
            if (!submitted) return;
            await submitted.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));
            const input = submitted.fields.getTextInputValue('input-custom-message');
            this.message.content = input;
            await submitted.editReply(this.getMessage(user, guild)).catch((err) => logger.debug({ err }, 'Could not edit reply'));
          }
          break;
        case 'title':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom-embed.editing-embed', { lng }))
                  .setCustomId('modal-custom-title')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-custom-title')
                        .setLabel(t('custom-embed.input.title', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.message.embed.title ?? '')
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-custom-url')
                        .setLabel(t('custom-embed.input.title-url', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.message.embed.url ?? '')
                    )
                  )
              )
              .catch((err) => logger.debug({ err }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'modal-custom-title',
                time: 60 * 10 * 1000
              })
              .catch((err) => logger.debug({ err }, 'Could not await modal submit'));
            if (!submitted) return;
            await submitted.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));
            const title = submitted.fields.getTextInputValue('input-custom-title');
            const url = submitted.fields.getTextInputValue('input-custom-url');
            const isValidEmbed = this.isValidEmbed({ ...this.message.embed, title, url }, user, guild);
            if (!isValidEmbed) return;
            this.message.embed.title = title;
            this.message.embed.url = url;
            await submitted.editReply(this.getMessage(user, guild)).catch((err) => logger.debug({ err }, 'Could not edit reply'));
          }
          break;
        case 'description':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom-embed.editing-embed', { lng }))
                  .setCustomId('modal-custom-description')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-custom-description')
                        .setLabel(t('custom-embed.input.description', { lng }))
                        .setStyle(TextInputStyle.Paragraph)
                        .setMaxLength(4000)
                        .setRequired(false)
                        .setValue(this.message.embed.description ?? '')
                    )
                  )
              )
              .catch((err) => logger.debug({ err }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'modal-custom-description',
                time: 60 * 10 * 1000
              })
              .catch((err) => logger.debug({ err }, 'Could not await modal submit'));
            if (!submitted) return;
            await submitted.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));
            const input = submitted.fields.getTextInputValue('input-custom-description');
            const isValidEmbed = this.isValidEmbed({ ...this.message.embed, description: input ?? '** **' }, user, guild);
            if (!isValidEmbed) return;
            this.message.embed.description = input ?? '** **';
            await submitted.editReply(this.getMessage(user, guild)).catch((err) => logger.debug({ err }, 'Could not edit reply'));
          }
          break;
        case 'author':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom-embed.editing-embed', { lng }))
                  .setCustomId('modal-custom-author')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-custom-name')
                        .setLabel(t('custom-embed.input.author-name', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.message.embed.author?.name ?? '')
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-custom-icon')
                        .setLabel(t('custom-embed.input.author-icon-url', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.message.embed.author?.icon_url ?? '')
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-custom-url')
                        .setLabel(t('custom-embed.input.author-url', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.message.embed.author?.url ?? '')
                    )
                  )
              )
              .catch((err) => logger.debug({ err }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'modal-custom-author',
                time: 60 * 10 * 1000
              })
              .catch((err) => logger.debug({ err }, 'Could not await modal submit'));
            if (!submitted) return;
            await submitted.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));
            const name = submitted.fields.getTextInputValue('input-custom-name');
            const icon_url = submitted.fields.getTextInputValue('input-custom-icon');
            const url = submitted.fields.getTextInputValue('input-custom-url');
            const isValidEmbed = this.isValidEmbed({ ...this.message.embed, author: { name, icon_url, url } }, user, guild);
            if (!isValidEmbed) return;
            this.message.embed.author = { name, icon_url, url };
            await submitted.editReply(this.getMessage(user, guild)).catch((err) => logger.debug({ err }, 'Could not edit reply'));
          }
          break;
        case 'footer':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom-embed.editing-embed', { lng }))
                  .setCustomId('modal-custom-footer')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-custom-text')
                        .setLabel(t('custom-embed.input.footer-text', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.message.embed.footer?.text ?? '')
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-custom-icon')
                        .setLabel(t('custom-embed.input.footer-icon-url', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.message.embed.footer?.icon_url ?? '')
                    )
                  )
              )
              .catch((err) => logger.debug({ err }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'modal-custom-footer',
                time: 60 * 10 * 1000
              })
              .catch((err) => logger.debug({ err }, 'Could not await modal submit'));
            if (!submitted) return;
            await submitted.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));
            const text = submitted.fields.getTextInputValue('input-custom-text');
            const icon_url = submitted.fields.getTextInputValue('input-custom-icon');
            const isValidEmbed = this.isValidEmbed({ ...this.message.embed, footer: { text, icon_url } }, user, guild);
            if (!isValidEmbed) return;
            this.message.embed.footer = { text, icon_url };
            await submitted.editReply(this.getMessage(user, guild)).catch((err) => logger.debug({ err }, 'Could not edit reply'));
          }
          break;
        case 'thumbnail':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom-embed.editing-embed', { lng }))
                  .setCustomId('modal-custom-thumbnail')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-custom-thumbnail')
                        .setLabel(t('custom-embed.input.thumbnail', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.message.embed.thumbnail ?? '')
                    )
                  )
              )
              .catch((err) => logger.debug({ err }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'modal-custom-thumbnail',
                time: 60 * 10 * 1000
              })
              .catch((err) => logger.debug({ err }, 'Could not await modal submit'));
            if (!submitted) return;
            await submitted.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));
            const input = submitted.fields.getTextInputValue('input-custom-thumbnail');
            const isValidEmbed = this.isValidEmbed({ ...this.message.embed, thumbnail: input }, user, guild);
            if (!isValidEmbed) return;
            this.message.embed.thumbnail = input;
            await submitted.editReply(this.getMessage(user, guild)).catch((err) => logger.debug({ err }, 'Could not edit reply'));
          }
          break;
        case 'image':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom-embed.editing-embed', { lng }))
                  .setCustomId('modal-custom-image')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-custom-image')
                        .setLabel(t('custom-embed.input.image', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.message.embed.image ?? '')
                    )
                  )
              )
              .catch((err) => logger.debug({ err }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'modal-custom-image',
                time: 60 * 10 * 1000
              })
              .catch((err) => logger.debug({ err }, 'Could not await modal submit'));
            if (!submitted) return;
            await submitted.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));
            const input = submitted.fields.getTextInputValue('input-custom-image');
            const isValidEmbed = this.isValidEmbed({ ...this.message.embed, image: input }, user, guild);
            if (!isValidEmbed) return;
            this.message.embed.image = input;
            await submitted.editReply(this.getMessage(user, guild)).catch((err) => logger.debug({ err }, 'Could not edit reply'));
          }
          break;
        case 'color':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom-embed.editing-embed', { lng }))
                  .setCustomId('modal-custom-color')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-custom-color')
                        .setLabel(t('custom-embed.input.color', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.message.embed.color?.toString() ?? '')
                    )
                  )
              )
              .catch((err) => logger.debug({ err }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'modal-custom-color',
                time: 60 * 10 * 1000
              })
              .catch((err) => logger.debug({ err }, 'Could not await modal submit'));
            if (!submitted) return;
            await submitted.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));
            const input = submitted.fields.getTextInputValue('input-custom-color');
            const hexRegex = /^#(?:[0-9a-fA-F]{3}){2}$/;
            if (!hexRegex.test(input)) this.message.embed.color = '#1e1f22';
            else this.message.embed.color = input;
            await submitted.editReply(this.getMessage(user, guild)).catch((err) => logger.debug({ err }, 'Could not edit reply'));
          }
          break;
        case 'add-field':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom-embed.editing-embed', { lng }))
                  .setCustomId('modal-custom-add-field')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-custom-title')
                        .setLabel(t('custom-embed.input.field-title', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-custom-text')
                        .setLabel(t('custom-embed.input.field-text', { lng }))
                        .setStyle(TextInputStyle.Paragraph)
                        .setMaxLength(1024)
                        .setRequired(false)
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-custom-inline')
                        .setLabel(t('custom-embed.input.field-inline', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(5)
                        .setRequired(true)
                        .setValue('false')
                        .setPlaceholder('true / false')
                    )
                  )
              )
              .catch((err) => logger.debug({ err }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'modal-custom-add-field',
                time: 60 * 10 * 1000
              })
              .catch((err) => logger.debug({ err }, 'Could not await modal submit'));
            if (!submitted) return;
            await submitted.deferUpdate().catch((err) => logger.debug({ err }, 'Could not defer update'));
            const name = submitted.fields.getTextInputValue('input-custom-title');
            const value = submitted.fields.getTextInputValue('input-custom-text');
            const inline = submitted.fields.getTextInputValue('input-custom-inline');
            const isValidEmbed = this.isValidEmbed(
              { ...this.message.embed, fields: [{ name, value, inline: inline.toLowerCase() === 'true' ? true : false }] },
              user,
              guild
            );
            if (!isValidEmbed) return;
            this.message.embed.fields?.push({
              name,
              value,
              inline: inline.toLowerCase() === 'true' ? true : false
            });
            await submitted.editReply(this.getMessage(user, guild)).catch((err) => logger.debug({ err }, 'Could not edit reply'));
          }
          break;
        case 'remove-field':
          {
            this.message.embed.fields?.pop();
            await buttonInteraction.update(this.getMessage(user, guild)).catch((err) => logger.debug({ err }, 'Could not update message'));
          }
          break;
        case 'reset':
          {
            this.message.embed = {
              color: '#1e1f22',
              description: undefined,
              image: undefined,
              thumbnail: undefined,
              title: undefined,
              url: undefined,
              author: {
                name: undefined,
                icon_url: undefined,
                url: undefined
              },
              footer: {
                text: undefined,
                icon_url: undefined
              },
              fields: []
            };
            await buttonInteraction.update(this.getMessage(user, guild)).catch((err) => logger.debug({ err }, 'Could not update message'));
          }
          break;
        case 'submit':
          {
            this.emit('submit', this.message);
            collector.stop();
          }
          break;
        case 'delete':
          {
            await buttonInteraction
              .update({
                content: t('custom-embed.deleted', { lng }),
                embeds: [],
                components: []
              })
              .catch((err) => logger.debug({ err }, 'Could not update message'));
            collector.stop();
          }
          break;
      }
    });
  }

  private isValidEmbed(embedData: Embed, user: User, guild: Guild) {
    try {
      const embed = getEmbed(user, guild, embedData);

      if (embed) return true;
      else return false;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  private getMessage(user: User, guild: Guild): InteractionEditReplyOptions {
    const embedData = this.message.embed;

    if (isEmptyEmbed(embedData)) {
      return {
        content: replacePlaceholders(this.message.content ?? '', user, guild),
        embeds: [new EmbedBuilder().setDescription('** **')]
      };
    }

    return {
      content: replacePlaceholders(this.message.content ?? '', user, guild),
      embeds: [getEmbed(user, guild, this.message.embed)]
    };
  }

  private getButtons(lng: string, disabled: boolean = false) {
    return [
      new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
          .setCustomId('button-custom-message')
          .setLabel(t('custom-embed.button.message', { lng }))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('button-custom-title')
          .setLabel(t('custom-embed.button.title', { lng }))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('button-custom-description')
          .setLabel(t('custom-embed.button.description', { lng }))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('button-custom-author')
          .setLabel(t('custom-embed.button.author', { lng }))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('button-custom-footer')
          .setLabel(t('custom-embed.button.footer', { lng }))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled)
      ),
      new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
          .setCustomId('button-custom-thumbnail')
          .setLabel(t('custom-embed.button.thumbnail', { lng }))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('button-custom-image')
          .setLabel(t('custom-embed.button.image', { lng }))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('button-custom-color')
          .setLabel(t('custom-embed.button.color', { lng }))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('button-custom-add-field')
          .setLabel(t('custom-embed.button.add-field', { lng }))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('button-custom-remove-field')
          .setLabel(t('custom-embed.button.remove-field', { lng }))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled)
      ),
      new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
          .setCustomId('button-custom-reset')
          .setLabel(t('custom-embed.button.reset', { lng }))
          .setStyle(ButtonStyle.Primary)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('button-custom-submit')
          .setLabel(t('custom-embed.button.submit', { lng }))
          .setStyle(ButtonStyle.Success)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('button-custom-delete')
          .setLabel(t('custom-embed.button.delete', { lng }))
          .setStyle(ButtonStyle.Danger)
          .setDisabled(disabled)
      )
    ];
  }
}

export function replacePlaceholders(string: string = '', user: User, guild: Guild) {
  return string
    .replace(/{user}/g, user.toString())
    .replace(/{user\.mention}/g, user.toString())
    .replace(/{user\.username}/g, user.username)
    .replace(/{user\.id}/g, user.id)
    .replace(/{user\.avatar}/g, user.displayAvatarURL())
    .replace(/{server}/g, guild.name)
    .replace(/{server\.name}/g, guild.name)
    .replace(/{server\.id}/g, guild.id)
    .replace(/{server\.icon}/g, guild.iconURL() || '')
    .replace(/{server\.member_count}/g, guild.memberCount.toString())
    .replace(/{guild}/g, guild.name)
    .replace(/{guild\.name}/g, guild.name)
    .replace(/{guild\.id}/g, guild.id)
    .replace(/{guild\.icon}/g, guild.iconURL() || '')
    .replace(/{guild\.member_count}/g, guild.memberCount.toString());
}

export function isEmptyEmbed(embedData: Embed) {
  if (
    !embedData.title?.length &&
    !embedData.fields?.length &&
    !embedData.description?.length &&
    !embedData.author?.name?.length &&
    !embedData.footer?.text?.length
  )
    return true;
  else return false;
}

export function getEmbed(user: User, guild: Guild, embed: Embed): EmbedBuilder {
  return EmbedBuilder.from({
    description: replacePlaceholders(embed.description ?? '', user, guild),
    title: replacePlaceholders(embed.title ?? '', user, guild),
    author: {
      name: replacePlaceholders(embed.author?.name ?? '', user, guild),
      icon_url: replacePlaceholders(embed.author?.icon_url ?? '', user, guild),
      url: replacePlaceholders(embed.author?.url ?? '', user, guild)
    },
    fields: embed.fields?.map((field) => ({
      name: replacePlaceholders(field.name ?? '', user, guild),
      value: replacePlaceholders(field.value ?? '', user, guild)
    })),
    footer: {
      text: replacePlaceholders(embed.footer?.text ?? '', user, guild),
      icon_url: replacePlaceholders(embed.footer?.icon_url ?? '', user, guild)
    },
    image: {
      url: replacePlaceholders(embed.image ?? '', user, guild)
    },
    thumbnail: {
      url: replacePlaceholders(embed.thumbnail ?? '', user, guild)
    },
    url: replacePlaceholders(embed.url ?? '', user, guild)
  }).setColor(embed.color as ColorResolvable);
}
