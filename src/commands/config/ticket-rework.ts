import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  InteractionContextType,
  InteractionResponse,
  Message,
  ModalBuilder,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  SlashCommandBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  type CollectorFilter,
  type Interaction,
  type MessageComponentType,
} from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import type { DiscordClient } from 'classes/client';
import { getGuildSettings } from 'db/guild';
import { getUserLanguage } from 'db/user';

const TIMEOUT_DURATION = 60_000; // Constant for the timeout duration

async function handleInteraction<ComponentT extends MessageComponentType>(
  interaction: ChatInputCommandInteraction,
  context: Message<true> | InteractionResponse<true>,
  client: DiscordClient,
  lng: string,
  componentType: ComponentT | undefined,
  filter: CollectorFilter<[Interaction]>,
) {
  return await context
    .awaitMessageComponent<ComponentT>({
      time: TIMEOUT_DURATION,
      componentType: componentType,
      dispose: true,
      filter,
    })
    .catch(() => {
      interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.timeout', { lng }))],
        components: [],
      });
      return;
    });
}

export default new Command({
  module: ModuleType.Config,
  data: new SlashCommandBuilder()
    .setName('ticket-rework-v1')
    .setDescription('Configure the ticket setup')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
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

    switch (options.getSubcommand()) {
      case 'setup':
        {
          if (config.ticket.systems.length >= 5)
            return interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.limit', { lng }))] });

          const staffMessage = await interaction.editReply({
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
            ],
          });
          const staffInteraction = await handleInteraction(interaction, staffMessage, client, lng, ComponentType.RoleSelect, (i) => i.user.id === user.id);
          if (!staffInteraction) return;
          const staffRole = staffInteraction.roles.first();
          if (!staffRole) return;

          const maxTicketsMessage = await staffInteraction.update({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.ticket)
                .setDescription(t('ticket.max-tickets.description', { lng }))
                .setFooter({ text: t('ticket.optional', { lng }) }),
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('button-ticket-max-tickets-set').setLabel(t('ticket.max-tickets.label', { lng })).setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('button-ticket-max-tickets-skip').setLabel(t('ticket.skip', { lng })).setStyle(ButtonStyle.Success),
              ),
            ],
          });
          const ticketsInteraction = await handleInteraction(interaction, maxTicketsMessage, client, lng, ComponentType.Button, (i) => i.user.id === user.id);
          if (!ticketsInteraction) return;
          let maxTickets = 1;
          if (ticketsInteraction.customId === 'button-ticket-max-tickets-set') {
            await ticketsInteraction.showModal(
              new ModalBuilder()
                .setCustomId('modal-ticket-max-tickets')
                .setTitle(t('ticket.max-tickets.title', { lng }))
                .setComponents(
                  new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                      .setCustomId('input-ticket-max-tickets')
                      .setLabel(t('ticket.max-tickets.label', { lng }))
                      .setStyle(TextInputStyle.Short)
                      .setMaxLength(5)
                      .setRequired(false),
                  ),
                ),
            );
            const maxTicketsModalInteraction = await ticketsInteraction
              .awaitModalSubmit({ time: TIMEOUT_DURATION, dispose: true, filter: (i) => i.user.id === user.id })
              .catch(() => {
                interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.max-tickets.timeout', { lng }))],
                  components: [],
                });
                return;
              });
            if (!maxTicketsModalInteraction) return;
            const input = maxTicketsModalInteraction.fields.getTextInputValue('input-ticket-max-tickets');
            if (!isNaN(parseInt(input))) {
              maxTickets = parseInt(input);
            }
            await maxTicketsModalInteraction.deferUpdate();
          }

          let transcriptMessage;
          if (ticketsInteraction.deferred || ticketsInteraction.replied) {
            transcriptMessage = await ticketsInteraction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor(client.colors.ticket)
                  .setDescription(t('ticket.transcript.description', { lng }))
                  .setFooter({ text: t('ticket.optional', { lng }) }),
              ],
              components: [
                new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                  new ChannelSelectMenuBuilder()
                    .setCustomId('select-ticket-transcript')
                    .setPlaceholder(t('ticket.transcript.placeholder', { lng }))
                    .setMaxValues(1)
                    .addChannelTypes(ChannelType.GuildText),
                ),
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  new ButtonBuilder().setCustomId('button-ticket-transcript-skip').setLabel(t('ticket.skip', { lng })).setStyle(ButtonStyle.Success),
                ),
              ],
            });
          } else {
            transcriptMessage = await ticketsInteraction.update({
              embeds: [
                new EmbedBuilder()
                  .setColor(client.colors.ticket)
                  .setDescription(t('ticket.transcript.description', { lng }))
                  .setFooter({ text: t('ticket.optional', { lng }) }),
              ],
              components: [
                new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                  new ChannelSelectMenuBuilder()
                    .setCustomId('select-ticket-transcript')
                    .setPlaceholder(t('ticket.transcript.placeholder', { lng }))
                    .setMaxValues(1)
                    .addChannelTypes(ChannelType.GuildText),
                ),
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  new ButtonBuilder().setCustomId('button-ticket-transcript-skip').setLabel(t('ticket.skip', { lng })).setStyle(ButtonStyle.Success),
                ),
              ],
            });
          }
          const transcriptInteraction = await handleInteraction(interaction, transcriptMessage, client, lng, undefined, (i) => i.user.id === user.id);
          if (!transcriptInteraction) return;
          let transcriptChannel: TextChannel | undefined;
          if (transcriptInteraction.isChannelSelectMenu()) {
            transcriptChannel = transcriptInteraction.channels.first() as TextChannel;
          }

          let choices: string[] = [];
          const choicesMessage = await transcriptInteraction.update({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.ticket)
                .setDescription(t('ticket.choices.description', { lng }))
                .setFooter({ text: t('ticket.required', { lng }) }),
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('button-ticket-choices-add').setLabel(t('ticket.choices.add', { lng })).setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('button-ticket-choices-remove').setLabel(t('ticket.choices.remove', { lng })).setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('button-ticket-choices-continue').setLabel(t('ticket.choices.continue', { lng })).setStyle(ButtonStyle.Success),
              ),
            ],
          });
          const collector = choicesMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            idle: TIMEOUT_DURATION,
            filter: (i) => i.user.id === user.id,
          });

          collector.on('collect', async (i) => {
            if (i.customId === 'button-ticket-choices-continue') {
              if (!choices.length || choices.length > 5)
                return i.update({
                  components: [],
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.limit', { lng }))],
                });
              collector.stop('continue');
            }
            if (i.customId === 'button-ticket-choices-add') {
              if (choices.length >= 5)
                return i.reply({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.limit', { lng }))],
                  ephemeral: true,
                });
              await i.showModal(
                new ModalBuilder()
                  .setCustomId('modal-ticket-choices-add')
                  .setTitle(t('ticket.choices.add', { lng }))
                  .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-ticket-choices-add')
                        .setLabel(t('ticket.choices.add', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(25)
                        .setRequired(true),
                    ),
                  ),
              );
              const choicesModalInteraction = await i
                .awaitModalSubmit({ time: TIMEOUT_DURATION, dispose: true, filter: (i) => i.user.id === user.id })
                .catch(() => {
                  i.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.timeout', { lng }))],
                    components: [],
                  });
                  return;
                });
              if (!choicesModalInteraction) return;
              const input = choicesModalInteraction.fields.getTextInputValue('input-ticket-choices-add');
              choices.push(input);
              await choicesModalInteraction.deferUpdate();
              await choicesModalInteraction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.colors.ticket)
                    .setDescription(t('ticket.choices.description', { lng }))
                    .addFields(...choices.map((choice, i) => ({ name: `${i + 1}.`, value: choice }))),
                ],
              });
            }
            if (i.customId === 'button-ticket-choices-remove') {
              if (!choices.length)
                return i.update({
                  components: [],
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.empty', { lng }))],
                });
              await i.showModal(
                new ModalBuilder()
                  .setCustomId('modal-ticket-choices-remove')
                  .setTitle(t('ticket.choices.remove', { lng }))
                  .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                      new TextInputBuilder()
                        .setCustomId('input-ticket-choices-remove')
                        .setLabel(t('ticket.choices.remove', { lng }))
                        .setStyle(TextInputStyle.Short)
                        .setMaxLength(25)
                        .setRequired(true),
                    ),
                  ),
              );
              const choicesModalInteraction = await i
                .awaitModalSubmit({ time: TIMEOUT_DURATION, dispose: true, filter: (i) => i.user.id === user.id })
                .catch(() => {
                  i.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.timeout', { lng }))],
                    components: [],
                  });
                  return;
                });
              if (!choicesModalInteraction) return;
              const input = choicesModalInteraction.fields.getTextInputValue('input-ticket-choices-remove');
              if (!choices.includes(input)) {
                choicesModalInteraction.reply({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.choices.invalid', { lng }))],
                  components: [],
                  ephemeral: true,
                });
                return;
              }
              choices = choices.filter((choice) => choice !== input);
              await choicesModalInteraction.deferUpdate();
              await choicesModalInteraction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.colors.ticket)
                    .setDescription(t('ticket.choices.description', { lng }))
                    .addFields(...choices.map((choice, i) => ({ name: `${i + 1}.`, value: choice }))),
                ],
              });
            }
          });

          collector.on('end', async () => {
            const channelMessage = await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor(client.colors.ticket)
                  .setDescription(t('ticket.channel.description', { lng }))
                  .setFooter({ text: t('ticket.required', { lng }) }),
              ],
              components: [
                new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
                  new ChannelSelectMenuBuilder()
                    .setCustomId('select-ticket-channel')
                    .setPlaceholder(t('ticket.channel.placeholder', { lng }))
                    .setMaxValues(1)
                    .addChannelTypes(ChannelType.GuildText),
                ),
              ],
            });
            const channelInteraction = await handleInteraction(
              interaction,
              channelMessage,
              client,
              lng,
              ComponentType.ChannelSelect,
              (i) => i.user.id === user.id,
            );
            if (!channelInteraction) return;
            const channel = channelInteraction.channels.first() as TextChannel;
            if (!channel.permissionsFor(guild.members.me!).has(PermissionFlagsBits.SendMessages)) {
              await channelInteraction.update({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.channel.permissions', { lng }))],
                components: [],
              });
            }

            // await updateGuildSettings(guild.id, {
            //   $push: {
            //     ['ticket.systems']: { channelId: channel.id, maxTickets, transcriptChannelId: transcriptChannel?.id, staffRoleId: staffRole.id, choices: [] },
            //   },
            // });
            await channelInteraction.update({
              embeds: [
                new EmbedBuilder()
                  .setColor(client.colors.ticket)
                  .setTitle('Your submitted values')
                  .setDescription(
                    [
                      `Staff role: ${staffRole}`,
                      `Max tickets: ${maxTickets}`,
                      `Transcript channel: ${transcriptChannel || '/'}`,
                      `Ticket create channel: ${channel}`,
                      `Choices:\n${choices.map((c, i) => `${i + 1}. ${c}`).join('\n')}`,
                    ].join('\n'),
                  ),
              ],
              components: [],
            });
          });
        }
        break;
      case 'info':
        {
          const systems = config.ticket.systems;
          if (!systems.length)
            return interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.no-systems', { lng }))] });

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
                ].join('\n'),
              )
              .addFields(...choices.map((choice, i) => ({ name: `${i + 1}.`, value: choice })));
          });
          await interaction.editReply({ embeds });
        }
        break;
    }
  },
});
