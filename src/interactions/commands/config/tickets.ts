import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  CategoryChannel,
  channelMention,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  Role,
  roleMention,
  RoleSelectMenuBuilder,
  SlashCommandBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  type APIRole
} from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { getGuildLanguage } from 'db/language';
import { createTicketGroup, deleteTicketGroup, disableTicketModule, enableTicketModule, getTicketConfig } from 'db/ticket';

import { logger } from 'utils/logger';

import { ModuleType } from 'types/interactions';
import type { TicketChoice } from 'types/ticket';

const TIMEOUT_DURATION = 60_000; // Constant for the timeout duration
const MAX_CHOICES = 5; // Discord has a max of 5 buttons in a row
const MAX_GROUPS = 5; // Limit the amount of ticket groups
const MAX_TICKETS = 2; // The default amount of tickets a user can have open at the same time

export default new Command({
  module: ModuleType.Config,
  botPermissions: ['SendMessages', 'ManageChannels'],
  data: new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Configure the ticket module')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .addSubcommand((cmd) => cmd.setName('enable').setDescription('Enable the ticket module'))
    .addSubcommand((cmd) => cmd.setName('disable').setDescription('Disable the ticket module'))
    .addSubcommand((cmd) => cmd.setName('setup').setDescription('Start the setup process for a ticket group'))
    .addSubcommand((cmd) => cmd.setName('info').setDescription('Show information about the ticket groups'))
    .addSubcommand((cmd) =>
      cmd
        .setName('delete')
        .setDescription('Delete a ticket group')
        .addStringOption((opt) => opt.setName('group-id').setDescription('The id of the ticket group to delete').setRequired(true))
    ),
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply();

    const { options, user, guild } = interaction;
    // const config = await getGuildSettings(guild.id);
    const config = (await getTicketConfig(guild.id)) ?? { enabled: false, groups: [] };

    // Subcommand handling
    switch (options.getSubcommand()) {
      case 'setup':
        await handleSetup();
        break;
      case 'info':
        await handleInfo();
        break;
      case 'delete':
        await handleDelete();
        break;
      case 'enable':
        await handleEnable();
        break;
      case 'disable':
        await handleDisable();
        break;
    }

    // Function declarations

    async function handleEnable() {
      if (config.enabled) {
        await interaction
          .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.enable.already', { lng }))] })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        return;
      }

      await enableTicketModule(guild.id);

      await interaction
        .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.ticket).setDescription(t('ticket.enable.success', { lng }))] })
        .catch((err) => logger.debug(err, 'Could not edit reply'));
    }

    async function handleDisable() {
      if (!config.enabled) {
        await interaction
          .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.disable.already', { lng }))] })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        return;
      }

      await disableTicketModule(guild.id);

      await interaction
        .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.ticket).setDescription(t('ticket.disable.success', { lng }))] })
        .catch((err) => logger.debug(err, 'Could not edit reply'));
    }

    async function handleDelete() {
      const groupId = interaction.options.getString('group-id', true);

      if (!config.groups.find((group) => group._id.toString() === groupId)) {
        await interaction
          .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.remove.invalid', { lng }))] })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        return;
      }

      await deleteTicketGroup(guild.id, groupId);

      await interaction
        .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.ticket).setDescription(t('ticket.remove.success', { lng }))] })
        .catch((err) => logger.debug(err, 'Could not edit reply'));
    }

    async function handleInfo() {
      if (!config.groups) {
        interaction
          .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.info.none', { lng }))] })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        return;
      }

      const embeds = config.groups.map((group) => {
        const { _id, maxTickets, transcriptChannelId, staffRoleId, choices, channelId, parentChannelId } = group;
        return new EmbedBuilder()
          .setColor(client.colors.ticket)
          .setTitle(t('ticket.info.id', { lng, id: _id.toString() }))
          .setDescription(
            [
              t('ticket.info.staff', { lng, role: roleMention(staffRoleId) }),
              t('ticket.info.max', { lng, max: maxTickets.toString() }),
              t('ticket.info.channel', { lng, channel: channelMention(channelId) }),
              t('ticket.info.transcript', { lng, channel: transcriptChannelId ? channelMention(transcriptChannelId) : t('none', { lng }) }),
              t('ticket.info.category', { lng, channel: parentChannelId ? channelMention(parentChannelId) : t('none', { lng }) }),
              t('ticket.info.choices', {
                lng,
                choices: choices.length
                  ? choices.map((c) => `${c.emoji ? c.emoji + ' ' : ''}${c.label} (${ButtonStyle[c.style]})`).join(', ')
                  : t('none', { lng })
              })
            ].join('\n')
          );
      });
      await interaction
        .editReply({
          embeds: [
            new EmbedBuilder().setColor(client.colors.ticket).addFields(
              {
                name: t('ticket.info.state', { lng }),
                value: config.enabled ? t('enabled', { lng }) : t('disabled', { lng })
              },
              {
                name: `${t('ticket.info.groups', { lng })} (${config.groups.length}/${MAX_GROUPS})`,
                value: config.groups.length ? t('ticket.info.displayed', { lng }) : t('ticket.info.none', { lng })
              }
            ),
            ...embeds
          ]
        })
        .catch((err) => logger.debug(err, 'Could not edit reply'));
    } // End of infoSubcommand

    async function handleSetup() {
      if (config.groups.length >= MAX_GROUPS) {
        await interaction
          .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.setup.limit', { lng }))] })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        return;
      }

      let staffRole: Role | APIRole | undefined;
      await handleStaffRole();

      async function handleStaffRole() {
        const staffMessage = await interaction
          .editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.ticket)
                .setDescription(`${t('ticket.staff.description', { lng })}\n\n${t('ticket.staff.none', { lng })}`)
                .setFooter({ text: t('ticket.setup.required', { lng }) })
            ],
            components: [
              new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
                new RoleSelectMenuBuilder().setCustomId('select-ticket-staff').setPlaceholder(t('ticket.staff.placeholder', { lng })).setMaxValues(1)
              ),
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('button-ticket-continue').setLabel(t('ticket.setup.continue', { lng })).setStyle(ButtonStyle.Primary)
              )
            ]
          })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        if (!staffMessage) return;

        const staffCollector = staffMessage.createMessageComponentCollector({
          idle: TIMEOUT_DURATION,
          filter: (i) => i.user.id === user.id
        });

        staffCollector.on('collect', async (staffInteraction) => {
          // If continue is pressed
          if (staffInteraction.customId === 'button-ticket-continue') {
            await staffInteraction.deferUpdate();

            // If no role is selected then we return a message that one must be selected as the staff role is not optional
            if (!staffRole) {
              await staffInteraction
                .followUp({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.staff.none', { lng }))],
                  flags: [MessageFlags.Ephemeral]
                })
                .catch((err) => logger.debug(err, 'Could not follow up'));
              return;
            }
            // We got a staff role, can stop the collector
            staffCollector.stop('continue');
          }

          // If a role is selected
          if (staffInteraction.isRoleSelectMenu()) {
            staffRole = staffInteraction.roles.first();

            // Update the message to show the selected role
            await staffInteraction
              .update({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.colors.ticket)
                    .setDescription(
                      `${t('ticket.staff.description', { lng })}\n\n${t('ticket.staff.selected', { lng, role: staffRole?.toString() })}\n${t('ticket.staff.continue', { lng })}`
                    )
                    .setFooter({ text: t('ticket.setup.required', { lng }) })
                ]
              })
              .catch((err) => logger.debug(err, 'Could not update staff message'));
          }
        });

        // If collector ends
        staffCollector.on('end', async (_, reason) => {
          // If the collector ended without continue or staffRole then we return a message that nothing was chosen/time ran out
          if (reason !== 'continue' || !staffRole) {
            await interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.setup.timeout', { lng }))],
                components: []
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }
          // We are done with staff role, continue with max tickets
          await handleMaxTickets();
        });
      }

      let maxTickets: number = MAX_TICKETS;
      async function handleMaxTickets() {
        const maxMessage = await interaction
          .editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.ticket)
                .setDescription(`${t('ticket.max.description', { lng })}\n\n${t('ticket.max.default', { lng, default: MAX_TICKETS.toString() })}`)
                .setFooter({ text: t('ticket.setup.optional', { lng }) })
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('button-ticket-max-change').setLabel(t('ticket.max.change', { lng })).setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('button-ticket-max-continue').setLabel(t('ticket.setup.continue', { lng })).setStyle(ButtonStyle.Primary)
              )
            ]
          })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        if (!maxMessage) return;

        const maxCollector = maxMessage.createMessageComponentCollector({
          idle: TIMEOUT_DURATION,
          filter: (i) => i.user.id === user.id
        });

        maxCollector.on('collect', async (maxInteraction) => {
          // If continue is pressed
          if (maxInteraction.customId === 'button-ticket-max-continue') {
            await maxInteraction.deferUpdate();
            maxCollector.stop('continue');
            return;
          }

          // If the set button is pressed
          if (maxInteraction.customId === 'button-ticket-max-change') {
            await maxInteraction
              .showModal(
                new ModalBuilder()
                  .setCustomId('modal-ticket-max-change')
                  .setTitle(t('ticket.max.label', { lng }))
                  .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-ticket-max-change')
                        .setLabel(t('ticket.max.label', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(1)
                        .setMaxLength(2)
                        .setRequired(true)
                    )
                  )
              )
              .catch((err) => logger.debug(err, 'Could not show modal'));

            // Wait for the user to submit the new value
            const maxModalInteraction = await maxInteraction
              .awaitModalSubmit({
                idle: TIMEOUT_DURATION,
                time: TIMEOUT_DURATION * 2,
                filter: (i) => i.user.id === user.id
              })
              .catch(() => {
                maxInteraction.followUp({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.modal.no-submit', { lng }))],
                  flags: [MessageFlags.Ephemeral]
                });
                return;
              });
            if (!maxModalInteraction) return;

            try {
              // Set maxTickets if a valid value is entered
              maxModalInteraction.fields.getTextInputValue('input-ticket-max-change');
              if (!isNaN(parseInt(maxModalInteraction.fields.getTextInputValue('input-ticket-max-change')))) {
                maxTickets = parseInt(maxModalInteraction.fields.getTextInputValue('input-ticket-max-change'));
              }

              // Edit the reply to show the new value
              await maxModalInteraction.deferUpdate().catch((err) => logger.debug(err, 'Could not defer update'));
              await maxModalInteraction
                .editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.ticket)
                      .setDescription(
                        `${t('ticket.max.description', { lng })}\n\n${t('ticket.max.selected', { lng, max: maxTickets.toString() })}\n${t('ticket.max.continue', { lng })}`
                      )
                      .setFooter({ text: t('ticket.setup.optional', { lng }) })
                  ]
                })
                .catch((err) => logger.debug(err, 'Could not edit reply'));
              return;
            } catch (err) {
              logger.debug(err, 'Could not set maxTickets');
            }
          }
        });

        maxCollector.on('end', async (_, reason) => {
          if (reason !== 'continue') {
            await interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.setup.timeout', { lng }))],
                components: []
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }

          // We are done with max tickets, continue with transcript channel
          await handleTranscriptChannel();
        });
      } // End of handleMaxTickets

      let transcriptChannel: TextChannel | undefined;
      async function handleTranscriptChannel() {
        const transcriptMessage = await interaction
          .editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.ticket)
                .setDescription(`${t('ticket.transcript.description', { lng })}\n\n${t('ticket.transcript.none', { lng })}`)
                .setFooter({ text: t('ticket.setup.optional', { lng }) })
            ],
            components: [
              new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                new ChannelSelectMenuBuilder()
                  .setCustomId('select-ticket-transcript-change')
                  .setPlaceholder(t('ticket.transcript.placeholder', { lng }))
                  .addChannelTypes(ChannelType.GuildText)
                  .setMaxValues(1)
              ),
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId('button-ticket-transcript-remove')
                  .setLabel(t('ticket.transcript.remove', { lng }))
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('button-ticket-transcript-continue').setLabel(t('ticket.setup.continue', { lng })).setStyle(ButtonStyle.Primary)
              )
            ]
          })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        if (!transcriptMessage) return;

        const transcriptCollector = transcriptMessage.createMessageComponentCollector({
          idle: TIMEOUT_DURATION,
          filter: (i) => i.user.id === user.id
        });

        transcriptCollector.on('collect', async (transcriptInteraction) => {
          // If continue is pressed
          if (transcriptInteraction.customId === 'button-ticket-transcript-continue') {
            await transcriptInteraction.deferUpdate();
            transcriptCollector.stop('continue');
            return;
          }

          // If the remove button is pressed
          if (transcriptInteraction.customId === 'button-ticket-transcript-remove') {
            transcriptChannel = undefined;
            await transcriptInteraction
              .update({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.colors.ticket)
                    .setDescription(`${t('ticket.transcript.description', { lng })}\n\n${t('ticket.transcript.none', { lng })}`)
                    .setFooter({ text: t('ticket.setup.optional', { lng }) })
                ]
              })
              .catch((err) => logger.debug(err, 'Could not update transcript message'));
            return;
          }

          // If a channel is selected
          if (transcriptInteraction.isChannelSelectMenu()) {
            transcriptChannel = transcriptInteraction.channels.first() as TextChannel;

            // Update the message to show the selected channel
            await transcriptInteraction
              .update({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.colors.ticket)
                    .setDescription(
                      `${t('ticket.transcript.description', { lng })}\n\n${t('ticket.transcript.selected', { lng, channel: transcriptChannel.toString() })}\n${t('ticket.transcript.continue', { lng })}`
                    )
                    .setFooter({ text: t('ticket.setup.optional', { lng }) })
                ]
              })
              .catch((err) => logger.debug(err, 'Could not update transcript message'));
            return;
          }
        });

        transcriptCollector.on('end', async (_, reason) => {
          if (reason !== 'continue') {
            await interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.setup.timeout', { lng }))],
                components: []
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }

          // We are done with transcript channel, continue with choices
          await handleChoices();
        });
      } // End of handleTranscriptChannel

      let choices: TicketChoice[] = [];
      async function handleChoices() {
        const choicesMessage = await interaction
          .editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.ticket)
                .setDescription(
                  `${t('ticket.choices.description', { lng })}\n\n${t('ticket.choices.none', { lng, max: MAX_CHOICES.toString() })}\n${t('ticket.choices.continue', { lng })}`
                )
                .setFooter({ text: t('ticket.setup.required', { lng }) })
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('button-ticket-choices-add').setLabel(t('ticket.choices.add', { lng })).setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('button-ticket-choices-remove').setLabel(t('ticket.choices.remove', { lng })).setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('button-ticket-choices-continue').setLabel(t('ticket.setup.continue', { lng })).setStyle(ButtonStyle.Primary)
              )
            ]
          })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        if (!choicesMessage) return;

        const choicesCollector = choicesMessage.createMessageComponentCollector({
          idle: TIMEOUT_DURATION,
          filter: (i) => i.user.id === user.id
        });

        choicesCollector.on('collect', async (choicesInteraction) => {
          // If continue is pressed
          if (choicesInteraction.customId === 'button-ticket-choices-continue') {
            if (!choices.length || choices.length > MAX_GROUPS) {
              await choicesInteraction
                .reply({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.none', { lng, max: MAX_CHOICES.toString() }))],
                  flags: [MessageFlags.Ephemeral]
                })
                .catch((err) => logger.debug(err, 'Could not reply'));
              return;
            }

            await choicesInteraction.deferUpdate().catch((err) => logger.debug(err, 'Could not defer update'));
            choicesCollector.stop('continue');
            return;
          }

          // If the add button is pressed
          if (choicesInteraction.customId === 'button-ticket-choices-add') {
            if (choices.length >= MAX_CHOICES) {
              await choicesInteraction
                .reply({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.limit', { lng, max: MAX_CHOICES.toString() }))],
                  flags: [MessageFlags.Ephemeral]
                })
                .catch((err) => logger.debug(err, 'Could not reply'));
              return;
            }

            await choicesInteraction
              .showModal(
                new ModalBuilder()
                  .setCustomId('modal-ticket-choices-add')
                  .setTitle(t('ticket.choices.add', { lng }))
                  .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-ticket-choices-label')
                        .setLabel(t('ticket.choices.label', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(32)
                        .setRequired(true)
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-ticket-choices-emoji')
                        .setLabel(t('ticket.choices.emoji', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(32)
                        .setRequired(false)
                    ),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-ticket-choices-style')
                        .setLabel(t('ticket.choices.style', { lng }))
                        .setPlaceholder(t('ticket.choices.style-placeholder', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(5)
                        .setRequired(false)
                    )
                  )
              )
              .catch((err) => logger.debug(err, 'Could not show modal'));

            const choicesModalInteraction = await choicesInteraction
              .awaitModalSubmit({
                idle: TIMEOUT_DURATION,
                time: TIMEOUT_DURATION * 2,
                filter: (i) => i.user.id === user.id
              })
              .catch(async () => {
                await choicesInteraction
                  .followUp({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.modal.no-submit', { lng }))],
                    flags: [MessageFlags.Ephemeral]
                  })
                  .catch((err) => logger.debug(err, 'Could not follow up'));
                return;
              });
            if (!choicesModalInteraction) return;

            try {
              const label = choicesModalInteraction.fields.getTextInputValue('input-ticket-choices-label');
              const hasChoice = choices.find((c) => c.label === label);

              if (hasChoice) {
                await choicesModalInteraction
                  .reply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.duplicate', { lng }))],
                    flags: [MessageFlags.Ephemeral]
                  })
                  .catch((err) => logger.debug(err, 'Could not reply'));
                return;
              }

              const style = choicesModalInteraction.fields.getTextInputValue('input-ticket-choices-style');
              const isColor = ['primary', 'blue', 'danger', 'red', 'success', 'green', 'secondary', 'gray', 'grey'].includes(style.toLowerCase());
              const colorMap = {
                primary: ButtonStyle.Primary,
                blue: ButtonStyle.Primary,
                danger: ButtonStyle.Danger,
                red: ButtonStyle.Danger,
                success: ButtonStyle.Success,
                green: ButtonStyle.Success,
                secondary: ButtonStyle.Secondary,
                grey: ButtonStyle.Secondary,
                gray: ButtonStyle.Secondary
              };

              if (style && !isColor) {
                await choicesModalInteraction
                  .reply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.invalid-style', { lng }))],
                    flags: [MessageFlags.Ephemeral]
                  })
                  .catch((err) => logger.debug(err, 'Could not reply'));
                return;
              }

              const emoji = choicesModalInteraction.fields.getTextInputValue('input-ticket-choices-emoji');
              const emojiRegex =
                /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;

              if (emoji && !emojiRegex.test(emoji)) {
                await choicesModalInteraction
                  .reply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.invalid-emoji', { lng }))],
                    flags: [MessageFlags.Ephemeral]
                  })
                  .catch((err) => logger.debug(err, 'Could not reply'));
                return;
              }

              choices.push({ label, emoji, style: isColor ? colorMap[style.toLowerCase() as keyof typeof colorMap] : ButtonStyle.Primary });

              await choicesModalInteraction.deferUpdate().catch((err) => logger.debug(err, 'Could not defer update'));
              await choicesModalInteraction
                .editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.ticket)
                      .setDescription(
                        `${t('ticket.choices.description', { lng })}\n\n${t('ticket.choices.selected', { lng, choices: choices.length ? choices.map((c) => `${c.emoji ? c.emoji + ' ' : ''}${c.label} (${ButtonStyle[c.style]})`).join(', ') : t('ticket.choices.none', { lng, max: MAX_CHOICES.toString() }) })}\n${t('ticket.choices.continue', { lng })}`
                      )
                      .setFooter({ text: t('ticket.setup.required', { lng }) })
                  ]
                })
                .catch((err) => logger.debug(err, 'Could not edit reply'));
              return;
            } catch (err) {
              logger.debug(err, 'Could not add choice');
            }
          }

          // If the remove button is pressed
          if (choicesInteraction.customId === 'button-ticket-choices-remove') {
            if (!choices.length) {
              await choicesInteraction
                .reply({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.length', { lng }))],
                  flags: [MessageFlags.Ephemeral]
                })
                .catch((err) => logger.debug(err, 'Could not reply'));
              return;
            }

            await choicesInteraction
              .showModal(
                new ModalBuilder()
                  .setCustomId('modal-ticket-choices-remove')
                  .setTitle(t('ticket.choices.remove', { lng }))
                  .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-ticket-choices-remove')
                        .setLabel(t('ticket.choices.label', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(32)
                        .setRequired(true)
                    )
                  )
              )
              .catch((err) => logger.debug(err, 'Could not show modal'));

            const choicesModalInteraction = await choicesInteraction
              .awaitModalSubmit({
                idle: TIMEOUT_DURATION,
                time: TIMEOUT_DURATION * 2,
                filter: (i) => i.user.id === user.id
              })
              .catch(async () => {
                await choicesInteraction
                  .followUp({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.modal.no-submit', { lng }))],
                    flags: [MessageFlags.Ephemeral]
                  })
                  .catch((err) => logger.debug(err, 'Could not follow up'));
                return;
              });
            if (!choicesModalInteraction) return;

            const label = choicesModalInteraction.fields.getTextInputValue('input-ticket-choices-remove');
            const hasChoice = choices.find((c) => c.label === label);

            if (!hasChoice) {
              await choicesModalInteraction
                .reply({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.invalid', { lng }))],
                  flags: [MessageFlags.Ephemeral]
                })
                .catch((err) => logger.debug(err, 'Could not reply'));
              return;
            }

            choices = choices.filter((c) => c.label !== label);

            await choicesModalInteraction.deferUpdate().catch((err) => logger.debug(err, 'Could not defer update'));
            await choicesModalInteraction
              .editReply({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.colors.ticket)
                    .setDescription(
                      `${t('ticket.choices.description', { lng })}\n\n${t('ticket.choices.selected', { lng, choices: choices.length ? choices.map((c) => `${c.emoji ? c.emoji + ' ' : ''}${c.label} (${ButtonStyle[c.style]})`).join(', ') : t('ticket.choices.none', { lng, max: MAX_CHOICES.toString() }) })}\n${t('ticket.choices.continue', { lng })}`
                    )
                    .setFooter({ text: t('ticket.setup.required', { lng }) })
                ]
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }
        });

        choicesCollector.on('end', async (_, reason) => {
          if (reason !== 'continue') {
            await interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.setup.timeout', { lng }))],
                components: []
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }

          // We are done with choices, continue with channel
          await handleCategory();
        });
      } // End of handleChoices

      let category: CategoryChannel | undefined;

      async function handleCategory() {
        const categoryMessage = await interaction
          .editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.ticket)
                .setDescription(`${t('ticket.category.description', { lng })}\n\n${t('ticket.category.none', { lng })}`)
                .setFooter({ text: t('ticket.setup.optional', { lng }) })
            ],
            components: [
              new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                new ChannelSelectMenuBuilder()
                  .setCustomId('select-ticket-category-change')
                  .setPlaceholder(t('ticket.category.placeholder', { lng }))
                  .addChannelTypes(ChannelType.GuildCategory)
                  .setMaxValues(1)
              ),
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('button-ticket-category-remove').setLabel(t('ticket.category.remove', { lng })).setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('button-ticket-category-continue').setLabel(t('ticket.setup.continue', { lng })).setStyle(ButtonStyle.Primary)
              )
            ]
          })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        if (!categoryMessage) return;

        const categoryCollector = categoryMessage.createMessageComponentCollector({
          idle: TIMEOUT_DURATION,
          filter: (i) => i.user.id === user.id
        });

        categoryCollector.on('collect', async (categoryInteraction) => {
          // If continue is pressed
          if (categoryInteraction.customId === 'button-ticket-category-continue') {
            await categoryInteraction.deferUpdate();
            categoryCollector.stop('continue');
            return;
          }

          // If the remove button is pressed
          if (categoryInteraction.customId === 'button-ticket-category-remove') {
            category = undefined;
            await categoryInteraction
              .update({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.colors.ticket)
                    .setDescription(`${t('ticket.category.description', { lng })}\n\n${t('ticket.category.none', { lng })}`)
                    .setFooter({ text: t('ticket.setup.optional', { lng }) })
                ]
              })
              .catch((err) => logger.debug(err, 'Could not update channel message'));
            return;
          }

          // If a channel is selected
          if (categoryInteraction.isChannelSelectMenu()) {
            category = categoryInteraction.channels.first() as CategoryChannel;

            // Update the message to show the selected channel
            await categoryInteraction
              .update({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.colors.ticket)
                    .setDescription(
                      `${t('ticket.category.description', { lng })}\n\n${t('ticket.category.selected', { lng, channel: category.toString() })}\n${t('ticket.category.continue', { lng })}`
                    )
                    .setFooter({ text: t('ticket.setup.optional', { lng }) })
                ]
              })
              .catch((err) => logger.debug(err, 'Could not update channel message'));
            return;
          }
        });

        categoryCollector.on('end', async (_, reason) => {
          if (reason !== 'continue') {
            await interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.setup.timeout', { lng }))],
                components: []
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }
          await handleChannel();
        });
      } // End of handleCategory

      let channel: TextChannel | undefined;

      async function handleChannel() {
        const channelMessage = await interaction
          .editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.ticket)
                .setDescription(`${t('ticket.channel.description', { lng })}\n\n${t('ticket.channel.none', { lng })}\n${t('ticket.channel.continue', { lng })}`)
                .setFooter({ text: t('ticket.setup.required', { lng }) })
            ],
            components: [
              new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                new ChannelSelectMenuBuilder()
                  .setCustomId('select-ticket-channel-change')
                  .setPlaceholder(t('ticket.channel.placeholder', { lng }))
                  .addChannelTypes(ChannelType.GuildText)
                  .setMaxValues(1)
              ),
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('button-ticket-channel-continue').setLabel(t('ticket.setup.continue', { lng })).setStyle(ButtonStyle.Primary)
              )
            ]
          })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        if (!channelMessage) return;

        const channelCollector = channelMessage.createMessageComponentCollector({
          idle: TIMEOUT_DURATION,
          filter: (i) => i.user.id === user.id
        });

        channelCollector.on('collect', async (channelInteraction) => {
          // If continue is pressed
          if (channelInteraction.customId === 'button-ticket-channel-continue') {
            if (!channel) {
              await channelInteraction.reply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.channel.none', { lng }))],
                flags: [MessageFlags.Ephemeral]
              });
              return;
            }

            await channelInteraction.deferUpdate();
            channelCollector.stop('continue');
            return;
          }

          // If a channel is selected
          if (channelInteraction.isChannelSelectMenu()) {
            channel = channelInteraction.channels.first() as TextChannel;

            if (!channel.permissionsFor(guild.members.me!).has(PermissionFlagsBits.SendMessages)) {
              channelInteraction.reply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.channel.permissions', { lng }))],
                flags: [MessageFlags.Ephemeral]
              });
              return;
            }

            // Update the message to show the selected channel
            await channelInteraction
              .update({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.colors.ticket)
                    .setDescription(
                      `${t('ticket.channel.description', { lng })}\n\n${t('ticket.channel.selected', { lng, channel: channel.toString() })}\n${t('ticket.channel.continue', { lng })}`
                    )
                    .setFooter({ text: t('ticket.setup.required', { lng }) })
                ]
              })
              .catch((err) => logger.debug(err, 'Could not update channel message'));
            return;
          }
        });

        channelCollector.on('end', async (_, reason) => {
          if (reason !== 'continue') {
            await interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.setup.timeout', { lng }))],
                components: []
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }
          await handleSubmit();
        });
      } // End of handleChannel

      async function handleSubmit() {
        const guildLng = await getGuildLanguage(guild.id);

        const newGroup = await createTicketGroup(guild.id, staffRole!.id, choices, maxTickets, channel!.id, transcriptChannel?.id, category?.id);

        const msg = await channel
          ?.send({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.general)
                .setTitle(t('ticket.message.title', { lng: guildLng }))
                .setDescription(t('ticket.message.description', { lng: guildLng }))
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                choices.map((choice, index) => {
                  const button = new ButtonBuilder()
                    .setCustomId(`button-tickets-create_${newGroup._id.toString()}_${index}`)
                    .setLabel(choice.label)
                    .setStyle(choice.style);
                  if (choice.emoji) button.setEmoji(choice.emoji);
                  return button;
                })
              )
            ]
          })
          .catch((err) => {
            logger.debug(err, 'Could not send message');

            interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.channel.error', { lng }))],
              components: []
            });
            return;
          });

        await interaction
          .editReply({
            content: msg?.url,
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.ticket)
                .setTitle(
                  t('ticket.info.id', {
                    lng,
                    id: newGroup._id.toString()
                  })
                )
                .setDescription(
                  [
                    t('ticket.info.staff', { lng, role: staffRole?.toString() }),
                    t('ticket.info.max', { lng, max: maxTickets.toString() }),
                    t('ticket.info.channel', { lng, channel: channel?.toString() }),
                    t('ticket.info.category', { lng, channel: category ? category.toString() : t('none', { lng }) }),
                    t('ticket.info.transcript', { lng, channel: transcriptChannel ? transcriptChannel.toString() : t('none', { lng }) }),
                    t('ticket.info.choices', {
                      lng,
                      choices: choices.length
                        ? choices.map((c) => `${c.emoji ? c.emoji + ' ' : ''}${c.label} (${ButtonStyle[c.style]})`).join(', ')
                        : t('none', { lng })
                    })
                  ].join('\n')
                )
            ],
            components: []
          })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
      } // End of handleSubmit
    } // End of setupSubcommand
  }
});
