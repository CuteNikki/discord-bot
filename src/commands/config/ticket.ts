import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  ModalBuilder,
  PermissionFlagsBits,
  Role,
  RoleSelectMenuBuilder,
  SlashCommandBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  type APIRole,
} from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { getGuildSettings, updateGuildSettings } from 'db/guild';
import { getUserLanguage } from 'db/user';
import { logger } from 'utils/logger';

const TIMEOUT_DURATION = 60_000; // Constant for the timeout duration

export default new Command({
  module: ModuleType.Config,
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Configure the ticket module')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .addSubcommand((cmd) => cmd.setName('enable').setDescription('Enable the ticket module'))
    .addSubcommand((cmd) => cmd.setName('disable').setDescription('Disable the ticket module'))
    .addSubcommand((cmd) => cmd.setName('setup').setDescription('Start the setup process for a ticket system'))
    .addSubcommand((cmd) => cmd.setName('info').setDescription('Show information about the ticket systems'))
    .addSubcommand((cmd) =>
      cmd
        .setName('delete')
        .setDescription('Delete a ticket system')
        .addStringOption((opt) => opt.setName('system-id').setDescription('The id of the ticket system to delete').setRequired(true)),
    ),
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply();

    const { options, user, guild } = interaction;
    const lng = await getUserLanguage(user.id);
    const config = await getGuildSettings(guild.id);

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
      if (config.ticket.enabled) {
        await interaction
          .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.enable.already', { lng }))] })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        return;
      }

      await updateGuildSettings(guild.id, { $set: { ['ticket.enabled']: true } });

      await interaction
        .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.success).setDescription(t('ticket.enable.success', { lng }))] })
        .catch((err) => logger.debug(err, 'Could not edit reply'));
    }

    async function handleDisable() {
      if (!config.ticket.enabled) {
        await interaction
          .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.disable.already', { lng }))] })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        return;
      }

      await updateGuildSettings(guild.id, { $set: { ['ticket.enabled']: false } });

      await interaction
        .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.success).setDescription(t('ticket.disable.success', { lng }))] })
        .catch((err) => logger.debug(err, 'Could not edit reply'));
    }

    async function handleDelete() {
      const systemId = interaction.options.getString('system-id');

      if (!config.ticket.systems.find((system) => system._id.toString() === systemId)) {
        await interaction
          .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.delete.none', { lng }))] })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        return;
      }

      await updateGuildSettings(guild.id, { $pull: { ['ticket.systems']: { _id: systemId } } });

      await interaction
        .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.success).setDescription(t('ticket.delete.success', { lng }))] })
        .catch((err) => logger.debug(err, 'Could not edit reply'));
    }

    async function handleInfo() {
      const systems = config.ticket.systems;

      if (!systems.length) {
        interaction
          .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.info.none', { lng }))] })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        return;
      }

      const embeds = systems.map((system) => {
        const { _id, maxTickets, transcriptChannelId, staffRoleId, choices, channelId } = system;
        return new EmbedBuilder()
          .setColor(client.colors.ticket)
          .setTitle(_id.toString())
          .setDescription(
            [
              `Channel: <#${channelId}>`,
              `Staff role: <@&${staffRoleId}>`,
              `Max tickets: ${maxTickets}`,
              `Transcript channel: ${transcriptChannelId ? `<#${transcriptChannelId}>` : '/'}`,
              `Choices: ${choices.join(', ') ?? '/'}`,
            ].join('\n'),
          );
      });
      await interaction.editReply({ embeds }).catch((err) => logger.debug(err, 'Could not edit reply'));
    } // End of infoSubcommand

    async function handleSetup() {
      if (config.ticket.systems.length >= 5) {
        await interaction
          .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.limit', { lng }))] })
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
                .setDescription(t('ticket.staff.select', { lng }))
                .setFooter({ text: t('ticket.required', { lng }) }),
            ],
            components: [
              new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
                new RoleSelectMenuBuilder().setCustomId('select-ticket-staff').setPlaceholder(t('ticket.staff.placeholder', { lng })).setMaxValues(1),
              ),
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('button-ticket-continue').setLabel(t('ticket.continue', { lng })).setStyle(ButtonStyle.Primary),
              ),
            ],
          })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        if (!staffMessage) return;

        const staffCollector = staffMessage.createMessageComponentCollector({
          idle: TIMEOUT_DURATION,
          filter: (i) => i.user.id === user.id,
        });

        staffCollector.on('collect', async (staffInteraction) => {
          // If continue is pressed
          if (staffInteraction.customId === 'button-ticket-continue') {
            await staffInteraction.deferUpdate();

            // If no role is selected then we return a message that one must be selected as the staff role is not optional
            if (!staffRole) {
              await staffInteraction
                .followUp({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(`You must select a role before continuing`)],
                  ephemeral: true,
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
                      `${t('ticket.staff.description', { lng })}\n\nCurrently selected: ${staffRole}\nPress continue to proceed with selected role`,
                    )
                    .setFooter({ text: t('ticket.required', { lng }) }),
                ],
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
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.timeout', { lng }))],
                components: [],
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }
          // We are done with staff role, continue with max tickets
          await handleMaxTickets();
        });
      }

      let maxTickets: number = 1;
      async function handleMaxTickets() {
        const maxMessage = await interaction
          .editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.ticket)
                .setDescription(`${t('ticket.max.description', { lng })}\n\nDefaults to 1 if not changed\nPress continue to proceed with default`)
                .setFooter({ text: t('ticket.optional', { lng }) }),
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('button-ticket-max-change').setLabel(t('ticket.max.change', { lng })).setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('button-ticket-max-continue').setLabel(t('ticket.continue', { lng })).setStyle(ButtonStyle.Primary),
              ),
            ],
          })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        if (!maxMessage) return;

        const maxCollector = maxMessage.createMessageComponentCollector({
          idle: TIMEOUT_DURATION,
          filter: (i) => i.user.id === user.id,
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
                  .setTitle(t('ticket.max.title', { lng }))
                  .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-ticket-max-change')
                        .setLabel(t('ticket.max.label', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(3)
                        .setRequired(false),
                    ),
                  ),
              )
              .catch((err) => logger.debug(err, 'Could not show modal'));

            // Wait for the user to submit the new value
            const maxModalInteraction = await maxInteraction
              .awaitModalSubmit({
                idle: TIMEOUT_DURATION,
                time: TIMEOUT_DURATION * 2,
                filter: (i) => i.user.id === user.id,
              })
              .catch(() => {
                maxInteraction.followUp({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.modal.no-submit', { lng }))],
                  ephemeral: true,
                });
                return;
              });
            if (!maxModalInteraction) return;

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
                      `${t('ticket.max.description', { lng })}\n\nValue was changed to ${maxTickets}\nPress continue to proceed with selected value`,
                    ),
                ],
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }
        });

        maxCollector.on('end', async (_, reason) => {
          if (reason !== 'continue') {
            await interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.timeout', { lng }))],
                components: [],
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
                .setDescription(
                  `${t('ticket.transcript.description', { lng })}\n\nIf no channel is selected then no transcript will be saved\nPress continue to proceed without a channel`,
                )
                .setFooter({ text: t('ticket.optional', { lng }) }),
            ],
            components: [
              new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                new ChannelSelectMenuBuilder()
                  .setCustomId('select-ticket-transcript-change')
                  .setPlaceholder(t('ticket.transcript.placeholder', { lng }))
                  .addChannelTypes(ChannelType.GuildText)
                  .setMaxValues(1),
              ),
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId('button-ticket-transcript-remove')
                  .setLabel(t('ticket.transcript.remove', { lng }))
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('button-ticket-transcript-continue').setLabel(t('ticket.continue', { lng })).setStyle(ButtonStyle.Primary),
              ),
            ],
          })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        if (!transcriptMessage) return;

        const transcriptCollector = transcriptMessage.createMessageComponentCollector({
          idle: TIMEOUT_DURATION,
          filter: (i) => i.user.id === user.id,
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
                    .setDescription(
                      `${t('ticket.transcript.description', { lng })}\n\nIf no channel is selected then no transcript will be saved\nPress continue to proceed without a channel`,
                    ),
                ],
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
                      `${t('ticket.transcript.description', { lng })}\n\nCurrently selected: ${transcriptChannel}\nPress continue to proceed with selected channel`,
                    )
                    .setFooter({ text: t('ticket.required', { lng }) }),
                ],
              })
              .catch((err) => logger.debug(err, 'Could not update transcript message'));
            return;
          }
        });

        transcriptCollector.on('end', async (_, reason) => {
          if (reason !== 'continue') {
            await interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.timeout', { lng }))],
                components: [],
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }

          // We are done with transcript channel, continue with choices
          await handleChoices();
        });
      } // End of handleTranscriptChannel

      let choices: string[] = [];
      async function handleChoices() {
        const choicesMessage = await interaction
          .editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.ticket)
                .setDescription(
                  `${t('ticket.choices.description', { lng })}\n\nCurrent choices: ${choices.length ? choices.join(', ') : 'you need to select at least one choice'}\nPress continue to proceed with choices`,
                )
                .setFooter({ text: t('ticket.required', { lng }) }),
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('button-ticket-choices-add').setLabel(t('ticket.choices.add', { lng })).setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('button-ticket-choices-remove').setLabel(t('ticket.choices.remove', { lng })).setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('button-ticket-choices-continue').setLabel(t('ticket.continue', { lng })).setStyle(ButtonStyle.Primary),
              ),
            ],
          })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        if (!choicesMessage) return;

        const choicesCollector = choicesMessage.createMessageComponentCollector({
          idle: TIMEOUT_DURATION,
          filter: (i) => i.user.id === user.id,
        });

        choicesCollector.on('collect', async (choicesInteraction) => {
          // If continue is pressed
          if (choicesInteraction.customId === 'button-ticket-choices-continue') {
            if (!choices.length || choices.length > 5) {
              await choicesInteraction
                .reply({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.invalid', { lng }))],
                  ephemeral: true,
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
            if (choices.length >= 5) {
              await choicesInteraction
                .reply({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.limit', { lng }))],
                  ephemeral: true,
                })
                .catch((err) => logger.debug(err, 'Could not reply'));
              return;
            }

            await choicesInteraction
              .showModal(
                new ModalBuilder()
                  .setCustomId('modal-ticket-choices-add')
                  .setTitle(t('ticket.choices.add-title', { lng }))
                  .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-ticket-choices-add')
                        .setLabel(t('ticket.choices.label', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(32)
                        .setRequired(true),
                    ),
                  ),
              )
              .catch((err) => logger.debug(err, 'Could not show modal'));

            const choicesModalInteraction = await choicesInteraction
              .awaitModalSubmit({
                idle: TIMEOUT_DURATION,
                time: TIMEOUT_DURATION * 2,
                filter: (i) => i.user.id === user.id,
              })
              .catch(async () => {
                await choicesInteraction
                  .followUp({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.modal.no-submit', { lng }))],
                    ephemeral: true,
                  })
                  .catch((err) => logger.debug(err, 'Could not follow up'));
                return;
              });
            if (!choicesModalInteraction) return;

            const choice = choicesModalInteraction.fields.getTextInputValue('input-ticket-choices-add');

            if (choices.includes(choice)) {
              await choicesModalInteraction
                .reply({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.duplicate', { lng }))],
                  ephemeral: true,
                })
                .catch((err) => logger.debug(err, 'Could not reply'));
              return;
            }

            choices.push(choice);
            await choicesModalInteraction.deferUpdate().catch((err) => logger.debug(err, 'Could not defer update'));
            await choicesModalInteraction
              .editReply({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.colors.ticket)
                    .setDescription(
                      `${t('ticket.choices.description', { lng })}\n\nCurrent choices: ${choices.length ? choices.join(', ') : 'you need to select at least one choice'}\nPress continue to proceed with choices`,
                    )
                    .setFooter({ text: t('ticket.required', { lng }) }),
                ],
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }

          // If the remove button is pressed
          if (choicesInteraction.customId === 'button-ticket-choices-remove') {
            if (!choices.length) {
              await choicesInteraction
                .reply({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.invalid', { lng }))],
                  ephemeral: true,
                })
                .catch((err) => logger.debug(err, 'Could not reply'));
              return;
            }

            await choicesInteraction
              .showModal(
                new ModalBuilder()
                  .setCustomId('modal-ticket-choices-remove')
                  .setTitle(t('ticket.choices.remove-title', { lng }))
                  .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-ticket-choices-remove')
                        .setLabel(t('ticket.choices.label', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(32)
                        .setRequired(true),
                    ),
                  ),
              )
              .catch((err) => logger.debug(err, 'Could not show modal'));

            const choicesModalInteraction = await choicesInteraction
              .awaitModalSubmit({
                idle: TIMEOUT_DURATION,
                time: TIMEOUT_DURATION * 2,
                filter: (i) => i.user.id === user.id,
              })
              .catch(async () => {
                await choicesInteraction
                  .followUp({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.modal.no-submit', { lng }))],
                    ephemeral: true,
                  })
                  .catch((err) => logger.debug(err, 'Could not follow up'));
                return;
              });
            if (!choicesModalInteraction) return;

            const choice = choicesModalInteraction.fields.getTextInputValue('input-ticket-choices-remove');

            if (!choices.includes(choice)) {
              await choicesModalInteraction
                .reply({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.invalid', { lng }))],
                  ephemeral: true,
                })
                .catch((err) => logger.debug(err, 'Could not reply'));
              return;
            }

            choices.splice(choices.indexOf(choice), 1);

            await choicesModalInteraction.deferUpdate().catch((err) => logger.debug(err, 'Could not defer update'));
            await choicesModalInteraction
              .editReply({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.colors.ticket)
                    .setDescription(
                      `${t('ticket.choices.description', { lng })}\n\nCurrent choices: ${choices.length ? choices.join(', ') : 'you need to select at least one choice'}\nPress continue to proceed with choices`,
                    )
                    .setFooter({ text: t('ticket.required', { lng }) }),
                ],
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }
        });

        choicesCollector.on('end', async (_, reason) => {
          if (reason !== 'continue') {
            await interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.timeout', { lng }))],
                components: [],
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }

          // We are done with choices, continue with channel
          await handleChannel();
        });
      } // End of handleChoices

      let channel: TextChannel | undefined;

      async function handleChannel() {
        const channelMessage = await interaction
          .editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.ticket)
                .setDescription(
                  `${t('ticket.channel.description', { lng })}\n\nCurrently selected: ${channel ? `${channel}` : '/'}\nPress continue to proceed with selected channel`,
                )
                .setFooter({ text: t('ticket.required', { lng }) }),
            ],
            components: [
              new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                new ChannelSelectMenuBuilder()
                  .setCustomId('select-ticket-channel-change')
                  .setPlaceholder(t('ticket.channel.placeholder', { lng }))
                  .addChannelTypes(ChannelType.GuildText)
                  .setMaxValues(1),
              ),
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('button-ticket-channel-continue').setLabel(t('ticket.continue', { lng })).setStyle(ButtonStyle.Primary),
              ),
            ],
          })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
        if (!channelMessage) return;

        const channelCollector = channelMessage.createMessageComponentCollector({
          idle: TIMEOUT_DURATION,
          filter: (i) => i.user.id === user.id,
        });

        channelCollector.on('collect', async (channelInteraction) => {
          // If continue is pressed
          if (channelInteraction.customId === 'button-ticket-channel-continue') {
            await channelInteraction.deferUpdate();
            channelCollector.stop('continue');
            return;
          }

          // If a channel is selected
          if (channelInteraction.isChannelSelectMenu()) {
            channel = channelInteraction.channels.first() as TextChannel;

            // Update the message to show the selected channel
            await channelInteraction
              .update({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.colors.ticket)
                    .setDescription(
                      `${t('ticket.channel.description', { lng })}\n\nCurrently selected: ${channel}\nPress continue to proceed with selected channel`,
                    )
                    .setFooter({ text: t('ticket.required', { lng }) }),
                ],
              })
              .catch((err) => logger.debug(err, 'Could not update channel message'));
            return;
          }
        });

        channelCollector.on('end', async (_, reason) => {
          if (reason !== 'continue') {
            await interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.timeout', { lng }))],
                components: [],
              })
              .catch((err) => logger.debug(err, 'Could not edit reply'));
            return;
          }
          await handleSubmit();
        });
      } // End of handleChannel

      async function handleSubmit() {
        await updateGuildSettings(guild.id, {
          $push: {
            ['ticket.systems']: { staffRoleId: staffRole?.id, transcriptChannelId: transcriptChannel?.id, channelId: channel?.id, choices, maxTickets },
          },
        });

        await interaction
          .editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.ticket)
                .setDescription(
                  [
                    `Staff role: ${staffRole ? `${staffRole}` : '/'}`,
                    `Max tickets: ${maxTickets}`,
                    `Transcript channel: ${transcriptChannel ? `<#${transcriptChannel.id}>` : '/'}`,
                    `Choices: ${choices.length ? choices.join(', ') : '/'}`,
                    `Channel: <#${channel?.id}>`,
                  ].join('\n'),
                ),
            ],
            components: [],
          })
          .catch((err) => logger.debug(err, 'Could not edit reply'));
      } // End of handleSubmit
    } // End of setupSubcommand
  },
});
