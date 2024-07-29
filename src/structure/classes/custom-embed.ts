import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  Guild,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  User,
  type ChatInputCommandInteraction,
  type ColorResolvable,
  type InteractionEditReplyOptions,
} from 'discord.js';
import events from 'events';
import { t } from 'i18next';

import type { DiscordClient } from 'classes/client';

import type { Message } from 'models/guild';

import { logger } from 'utils/logger';

export class CustomEmbedBuilder extends events {
  data: Message;
  constructor(
    public options: {
      interaction: ChatInputCommandInteraction;
      client: DiscordClient;
      data?: Message;
    },
  ) {
    super();

    if (options.data) this.data = options.data;
    else
      this.data = {
        content: null,
        embed: {
          color: null,
          description: null,
          image: undefined,
          thumbnail: undefined,
          title: null,
          url: null,
          author: {
            name: null,
            url: null,
            icon_url: null,
          },
          footer: {
            text: null,
            icon_url: null,
          },
          fields: [],
        },
      };

    this.start();
  }

  private async start() {
    const interaction = this.options.interaction;
    const user = interaction.user;
    const guild = interaction.guild;
    if (!guild) return;

    const client = this.options.client;
    const lng = await client.getUserLanguage(user.id);

    const embedData = this.data.embed;

    const embed = EmbedBuilder.from({
      title: replacePlaceholders(embedData.title ?? '', user, guild),
      author: {
        name: replacePlaceholders(embedData.author?.name ?? '', user, guild),
        icon_url: replacePlaceholders(embedData.author?.icon_url ?? '', user, guild),
        url: replacePlaceholders(embedData.author.url ?? '', user, guild),
      },
      description: replacePlaceholders(embedData.description ?? '', user, guild),
      fields: embedData.fields.map((field) => ({
        name: replacePlaceholders(field.name, user, guild),
        value: replacePlaceholders(field.value ?? '', user, guild),
      })),
      footer: {
        text: replacePlaceholders(embedData.footer?.text ?? '', user, guild),
        icon_url: replacePlaceholders(embedData.footer?.icon_url ?? '', user, guild),
      },
      image: { url: replacePlaceholders(embedData.image ?? '', user, guild) },
      thumbnail: {
        url: replacePlaceholders(embedData.thumbnail ?? '', user, guild),
      },
      url: replacePlaceholders(embedData.url ?? '', user, guild),
    }).setColor(embedData.color as ColorResolvable);

    const message = await interaction
      .editReply({
        content: replacePlaceholders(this.data.content ?? '', user, guild),
        embeds: [embed],
        components: this.getComponents(lng),
      })
      .catch((error) => logger.debug({ error }, 'Could not edit message'));
    if (!message) return;

    const collector = message.createMessageComponentCollector({
      idle: 60 * 10 * 1000,
      componentType: ComponentType.Button,
    });

    collector.on('end', (_, reason) => {
      if (reason === 'idle')
        interaction
          .editReply({
            content: null,
            embeds: [embed],
            components: this.getComponents(lng, true),
          })
          .catch((error) => logger.debug({ error }, 'Could not edit message'));
    });

    collector.on('collect', async (buttonInteraction) => {
      switch (buttonInteraction.customId.split('_')[1]) {
        case 'message':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom_embed.editing_embed', { lng }))
                  .setCustomId('CEM_message')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('CEI_message')
                        .setLabel(t('custom_embed.input.message', { lng }))
                        .setStyle(TextInputStyle.Paragraph)
                        .setMaxLength(2000)
                        .setRequired(false)
                        .setValue(this.data.content ?? ''),
                    ),
                  ),
              )
              .catch((error) => logger.debug({ error }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'CEM_message',
                time: 60 * 10 * 1000,
              })
              .catch((error) => logger.debug({ error }, 'Could not await modal submit'));
            if (!submitted) return;
            if (!submitted.deferred) await submitted.deferUpdate().catch((error) => logger.debug({ error }, 'Could not defer update'));
            const input = submitted.fields.getTextInputValue('CEI_message');
            this.data.content = input;
            await submitted.editReply(this.getEmbedData(user, guild)).catch((error) => logger.debug({ error }, 'Could not edit reply'));
          }
          break;
        case 'title':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom_embed.editing_embed', { lng }))
                  .setCustomId('CEM_title')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('CEI_title')
                        .setLabel(t('custom_embed.input.title', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.data.embed.title ?? ''),
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('CEI_url')
                        .setLabel(t('custom_embed.input.title_url', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.data.embed.url ?? ''),
                    ),
                  ),
              )
              .catch((error) => logger.debug({ error }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'CEM_title',
                time: 60 * 10 * 1000,
              })
              .catch((error) => logger.debug({ error }, 'Could not await modal submit'));
            if (!submitted) return;
            if (!submitted.deferred) await submitted.deferUpdate().catch((error) => logger.debug({ error }, 'Could not defer update'));
            const title = submitted.fields.getTextInputValue('CEI_title');
            const url = submitted.fields.getTextInputValue('CEI_url');
            this.data.embed.title = title;
            this.data.embed.url = url;
            await submitted.editReply(this.getEmbedData(user, guild)).catch((error) => logger.debug({ error }, 'Could not edit reply'));
          }
          break;
        case 'description':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom_embed.editing_embed', { lng }))
                  .setCustomId('CEM_description')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('CEI_description')
                        .setLabel(t('custom_embed.input.description', { lng }))
                        .setStyle(TextInputStyle.Paragraph)
                        .setMaxLength(4000)
                        .setRequired(false)
                        .setValue(this.data.embed.description ?? ''),
                    ),
                  ),
              )
              .catch((error) => logger.debug({ error }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'CEM_description',
                time: 60 * 10 * 1000,
              })
              .catch((error) => logger.debug({ error }, 'Could not await modal submit'));
            if (!submitted) return;
            if (!submitted.deferred) await submitted.deferUpdate().catch((error) => logger.debug({ error }, 'Could not defer update'));
            const input = submitted.fields.getTextInputValue('CEI_description');
            this.data.embed.description = input.length ? input : null;
            await submitted.editReply(this.getEmbedData(user, guild)).catch((error) => logger.debug({ error }, 'Could not edit reply'));
          }
          break;
        case 'author':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom_embed.editing_embed', { lng }))
                  .setCustomId('CEM_author')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('CEI_name')
                        .setLabel(t('custom_embed.input.author_name', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.data.embed.author?.name ?? ''),
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('CEI_icon')
                        .setLabel(t('custom_embed.input.author_icon_url', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.data.embed.author?.icon_url ?? ''),
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('CEI_url')
                        .setLabel(t('custom_embed.input.author_url', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.data.embed.author?.url ?? ''),
                    ),
                  ),
              )
              .catch((error) => logger.debug({ error }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'CEM_author',
                time: 60 * 10 * 1000,
              })
              .catch((error) => logger.debug({ error }, 'Could not await modal submit'));
            if (!submitted) return;
            if (!submitted.deferred) await submitted.deferUpdate().catch((error) => logger.debug({ error }, 'Could not defer update'));
            const name = submitted.fields.getTextInputValue('CEI_name');
            const icon_url = submitted.fields.getTextInputValue('CEI_icon');
            const url = submitted.fields.getTextInputValue('CEI_url');
            this.data.embed.author = { name, icon_url, url };
            await submitted.editReply(this.getEmbedData(user, guild)).catch((error) => logger.debug({ error }, 'Could not edit reply'));
          }
          break;
        case 'footer':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom_embed.editing_embed', { lng }))
                  .setCustomId('CEM_footer')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('CEI_text')
                        .setLabel(t('custom_embed.input.footer_text', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.data.embed.footer?.text ?? ''),
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('CEI_icon')
                        .setLabel(t('custom_embed.input.footer_icon_url', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.data.embed.footer?.icon_url ?? ''),
                    ),
                  ),
              )
              .catch((error) => logger.debug({ error }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'CEM_footer',
                time: 60 * 10 * 1000,
              })
              .catch((error) => logger.debug({ error }, 'Could not await modal submit'));
            if (!submitted) return;
            if (!submitted.deferred) await submitted.deferUpdate().catch((error) => logger.debug({ error }, 'Could not defer update'));
            const text = submitted.fields.getTextInputValue('CEI_text');
            const icon_url = submitted.fields.getTextInputValue('CEI_icon');
            this.data.embed.footer = { text, icon_url };
            await submitted.editReply(this.getEmbedData(user, guild)).catch((error) => logger.debug({ error }, 'Could not edit reply'));
          }
          break;
        case 'thumbnail':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom_embed.editing_embed', { lng }))
                  .setCustomId('CEM_thumbnail')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('CEI_thumbnail')
                        .setLabel(t('custom_embed.input.thumbnail', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.data.embed.thumbnail ?? ''),
                    ),
                  ),
              )
              .catch((error) => logger.debug({ error }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'CEM_thumbnail',
                time: 60 * 10 * 1000,
              })
              .catch((error) => logger.debug({ error }, 'Could not await modal submit'));
            if (!submitted) return;
            if (!submitted.deferred) await submitted.deferUpdate().catch((error) => logger.debug({ error }, 'Could not defer update'));
            const input = submitted.fields.getTextInputValue('CEI_thumbnail');
            this.data.embed.thumbnail = input;
            await submitted.editReply(this.getEmbedData(user, guild)).catch((error) => logger.debug({ error }, 'Could not edit reply'));
          }
          break;
        case 'image':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom_embed.editing_embed', { lng }))
                  .setCustomId('CEM_image')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('CEI_image')
                        .setLabel(t('custom_embed.input.image', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.data.embed.image ?? ''),
                    ),
                  ),
              )
              .catch((error) => logger.debug({ error }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'CEM_image',
                time: 60 * 10 * 1000,
              })
              .catch((error) => logger.debug({ error }, 'Could not await modal submit'));
            if (!submitted) return;
            if (!submitted.deferred) await submitted.deferUpdate().catch((error) => logger.debug({ error }, 'Could not defer update'));
            const input = submitted.fields.getTextInputValue('CEI_image');
            this.data.embed.image = input;
            await submitted.editReply(this.getEmbedData(user, guild)).catch((error) => logger.debug({ error }, 'Could not edit reply'));
          }
          break;
        case 'color':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom_embed.editing_embed', { lng }))
                  .setCustomId('CEM_color')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('CEI_color')
                        .setLabel(t('custom_embed.input.color', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false)
                        .setValue(this.data.embed.color?.toString() ?? ''),
                    ),
                  ),
              )
              .catch((error) => logger.debug({ error }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'CEM_color',
                time: 60 * 10 * 1000,
              })
              .catch((error) => logger.debug({ error }, 'Could not await modal submit'));
            if (!submitted) return;
            if (!submitted.deferred) await submitted.deferUpdate().catch((error) => logger.debug({ error }, 'Could not defer update'));
            const input = submitted.fields.getTextInputValue('CEI_color');
            const hexRegex = /^#(?:[0-9a-fA-F]{3}){2}$/;
            if (!hexRegex.test(input)) this.data.embed.color = '#1e1f22';
            else this.data.embed.color = input;
            await submitted.editReply(this.getEmbedData(user, guild)).catch((error) => logger.debug({ error }, 'Could not edit reply'));
          }
          break;
        case 'add-field':
          {
            await buttonInteraction
              .showModal(
                new ModalBuilder()
                  .setTitle(t('custom_embed.editing_embed', { lng }))
                  .setCustomId('CEM_add-field')
                  .setComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('CEI_title')
                        .setLabel(t('custom_embed.input.field_title', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(256)
                        .setRequired(false),
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('CEI_text')
                        .setLabel(t('custom_embed.input.field_text', { lng }))
                        .setStyle(TextInputStyle.Paragraph)
                        .setMaxLength(1024)
                        .setRequired(false),
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('CEI_inline')
                        .setLabel(t('custom_embed.input.field_inline', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(5)
                        .setRequired(true)
                        .setValue('false')
                        .setPlaceholder('true / false'),
                    ),
                  ),
              )
              .catch((error) => logger.debug({ error }, 'Could not show modal'));
            const submitted = await buttonInteraction
              .awaitModalSubmit({
                filter: (int) => int.customId === 'CEM_add-field',
                time: 60 * 10 * 1000,
              })
              .catch((error) => logger.debug({ error }, 'Could not await modal submit'));
            if (!submitted) return;
            if (!submitted.deferred) await submitted.deferUpdate().catch((error) => logger.debug({ error }, 'Could not defer update'));
            const name = submitted.fields.getTextInputValue('CEI_title');
            const value = submitted.fields.getTextInputValue('CEI_text');
            const inline = submitted.fields.getTextInputValue('CEI_inline');
            this.data.embed.fields.push({
              name,
              value,
              inline: inline.toLowerCase() === 'true' ? true : false,
            });
            await submitted.editReply(this.getEmbedData(user, guild)).catch((error) => logger.debug({ error }, 'Could not edit reply'));
          }
          break;
        case 'remove-field':
          {
            this.data.embed.fields.pop();
            await buttonInteraction.update(this.getEmbedData(user, guild)).catch((error) => logger.debug({ error }, 'Could not update message'));
          }
          break;
        case 'reset':
          {
            this.data.embed = {
              color: null,
              description: null,
              image: undefined,
              thumbnail: undefined,
              title: null,
              url: null,
              author: { name: null, icon_url: null, url: null },
              footer: { text: null, icon_url: null },
              fields: [],
            };
            await buttonInteraction.update(this.getEmbedData(user, guild)).catch((error) => logger.debug({ error }, 'Could not update message'));
          }
          break;
        case 'submit':
          {
            if (this.isEmptyEmbed())
              return buttonInteraction
                .reply({
                  content: t('custom_embed.empty', { lng }),
                  embeds: [],
                  components: [],
                  ephemeral: true,
                })
                .catch((error) => logger.debug({ error }, 'Could not reply'));
            this.emit('submit', this.data);
            collector.stop();
          }
          break;
        case 'delete':
          {
            await buttonInteraction
              .update({
                content: t('custom_embed.deleted', { lng }),
                embeds: [],
                components: [],
              })
              .catch((error) => logger.debug({ error }, 'Could not update message'));
            collector.stop();
          }
          break;
      }
    });
  }

  private getEmbedData(user: User, guild: Guild): InteractionEditReplyOptions {
    const embedData = this.data.embed;

    return {
      content: replacePlaceholders(this.data.content ?? '', user, guild),
      embeds: [
        EmbedBuilder.from({
          description: replacePlaceholders(embedData.description ?? '', user, guild),
          title: replacePlaceholders(embedData.title ?? '', user, guild),
          author: {
            name: replacePlaceholders(embedData.author?.name ?? '', user, guild),
            icon_url: replacePlaceholders(embedData.author?.icon_url ?? '', user, guild),
            url: replacePlaceholders(embedData.author.url ?? '', user, guild),
          },
          fields: embedData.fields.map((field) => ({
            name: replacePlaceholders(field.name, user, guild),
            value: replacePlaceholders(field.value ?? '', user, guild),
          })),
          footer: {
            text: replacePlaceholders(embedData.footer?.text ?? '', user, guild),
            icon_url: replacePlaceholders(embedData.footer?.icon_url ?? '', user, guild),
          },
          image: {
            url: replacePlaceholders(embedData.image ?? '', user, guild),
          },
          thumbnail: {
            url: replacePlaceholders(embedData.thumbnail ?? '', user, guild),
          },
          url: replacePlaceholders(embedData.url ?? '', user, guild),
        }).setColor(this.data.embed.color as ColorResolvable),
      ],
    };
  }

  private isEmptyEmbed() {
    const embedData = this.data.embed;
    if (
      !embedData.title?.length &&
      !embedData.fields.length &&
      !embedData.description?.length &&
      !embedData.author?.name?.length &&
      !embedData.footer?.text?.length
    )
      return true;
    else return false;
  }

  private getComponents(lng: string, disabled: boolean = false) {
    return [
      new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
          .setCustomId('CEB_message')
          .setLabel(t('custom_embed.button.message', { lng }))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled),
        new ButtonBuilder().setCustomId('CEB_title').setLabel(t('custom_embed.button.title', { lng })).setStyle(ButtonStyle.Secondary).setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('CEB_description')
          .setLabel(t('custom_embed.button.description', { lng }))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled),
        new ButtonBuilder().setCustomId('CEB_author').setLabel(t('custom_embed.button.author', { lng })).setStyle(ButtonStyle.Secondary).setDisabled(disabled),
        new ButtonBuilder().setCustomId('CEB_footer').setLabel(t('custom_embed.button.footer', { lng })).setStyle(ButtonStyle.Secondary).setDisabled(disabled),
      ),
      new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
          .setCustomId('CEB_thumbnail')
          .setLabel(t('custom_embed.button.thumbnail', { lng }))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled),
        new ButtonBuilder().setCustomId('CEB_image').setLabel(t('custom_embed.button.image', { lng })).setStyle(ButtonStyle.Secondary).setDisabled(disabled),
        new ButtonBuilder().setCustomId('CEB_color').setLabel(t('custom_embed.button.color', { lng })).setStyle(ButtonStyle.Secondary).setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('CEB_add-field')
          .setLabel(t('custom_embed.button.add_field', { lng }))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId('CEB_remove-field')
          .setLabel(t('custom_embed.button.remove_field', { lng }))
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled),
      ),
      new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder().setCustomId('CEB_reset').setLabel(t('custom_embed.button.reset', { lng })).setStyle(ButtonStyle.Primary).setDisabled(disabled),
        new ButtonBuilder().setCustomId('CEB_submit').setLabel(t('custom_embed.button.submit', { lng })).setStyle(ButtonStyle.Success).setDisabled(disabled),
        new ButtonBuilder().setCustomId('CEB_delete').setLabel(t('custom_embed.button.delete', { lng })).setStyle(ButtonStyle.Danger).setDisabled(disabled),
      ),
    ];
  }
}

export function replacePlaceholders(string: string, user: User, guild: Guild) {
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
