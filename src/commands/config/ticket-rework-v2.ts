import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionContextType,
  ModalBuilder,
  PermissionFlagsBits,
  Role,
  RoleSelectMenuBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  type APIRole,
} from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { getGuildSettings } from 'db/guild';
import { getUserLanguage } from 'db/user';

const TIMEOUT_DURATION = 60_000; // Constant for the timeout duration

export default new Command({
  module: ModuleType.Config,
  data: new SlashCommandBuilder()
    .setName('ticket-rework')
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
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('button-ticket-continue').setStyle(ButtonStyle.Success).setLabel(t('ticket.continue', { lng })),
              ),
            ],
          });
          const staffCollector = staffMessage.createMessageComponentCollector({
            idle: TIMEOUT_DURATION,
            filter: (i) => i.user.id === user.id,
          });
          let staffRole: Role | APIRole | undefined;
          staffCollector.on('collect', async (staffInteraction) => {
            if (staffInteraction.customId === 'button-ticket-continue') {
              await staffInteraction.deferUpdate();
              if (!staffRole) {
                return staffInteraction.followUp({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(`You must select a role before continuing`)],
                  ephemeral: true,
                });
              }
              staffCollector.stop('continue');
            }
            if (staffInteraction.isRoleSelectMenu()) {
              staffRole = staffInteraction.roles.first();
              await staffInteraction.update({
                embeds: [
                  new EmbedBuilder()
                    .setColor(client.colors.ticket)
                    .setDescription(
                      `${t('ticket.staff.description', { lng })}\n\nCurrently selected: ${staffRole}\nPress continue to proceed with selected role`,
                    )
                    .setFooter({ text: t('ticket.required', { lng }) }),
                ],
              });
            }
          });
          staffCollector.on('end', async (_, reason) => {
            if (reason !== 'continue' || !staffRole) {
              return await interaction.editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.timeout', { lng }))],
                components: [],
              });
            }
            const ticketsMessage = await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor(client.colors.ticket)
                  .setDescription(`${t('ticket.tickets.description', { lng })}\n\nDefaults to 1 if not changed\nPress continue to proceed`)
                  .setFooter({ text: t('tickets.optional', { lng }) }),
              ],
              components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  new ButtonBuilder().setCustomId('button-ticket-tickets-change').setLabel(t('ticket.tickets.change', { lng })).setStyle(ButtonStyle.Primary),
                  new ButtonBuilder().setCustomId('button-ticket-tickets-continue').setLabel(t('ticket.continue', { lng })).setStyle(ButtonStyle.Success),
                ),
              ],
            });
            const ticketsCollector = ticketsMessage.createMessageComponentCollector({
              idle: TIMEOUT_DURATION,
              filter: (i) => i.user.id === user.id,
            });
            let maxTickets = 1;
            ticketsCollector.on('collect', async (ticketsInteraction) => {
              if (ticketsInteraction.customId === 'button-ticket-tickets-continue') {
                await ticketsInteraction.deferUpdate();
                ticketsCollector.stop('continue');
              } else if (ticketsInteraction.customId === 'button-ticket-tickets-change') {
                await ticketsInteraction.showModal(
                  new ModalBuilder()
                    .setCustomId('modal-ticket-tickets-change')
                    .setTitle(t('ticket.tickets.title', { lng }))
                    .addComponents(
                      new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                          .setCustomId('input-ticket-tickets-change')
                          .setLabel(t('ticket.tickets.label', { lng }))
                          .setStyle(TextInputStyle.Short)
                          .setMaxLength(3)
                          .setRequired(false),
                      ),
                    ),
                );
                const ticketsModalInteraction = await ticketsInteraction.awaitModalSubmit({
                  idle: TIMEOUT_DURATION,
                  time: TIMEOUT_DURATION,
                  filter: (i) => i.user.id === user.id,
                });
                ticketsModalInteraction.fields.getTextInputValue('input-ticket-tickets-change');
                if (!isNaN(parseInt(ticketsModalInteraction.fields.getTextInputValue('input-ticket-tickets-change')))) {
                  maxTickets = parseInt(ticketsModalInteraction.fields.getTextInputValue('input-ticket-tickets-change'));
                }
                await ticketsModalInteraction.deferUpdate();
                await ticketsModalInteraction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.ticket)
                      .setDescription(
                        `${t('ticket.tickets.description', { lng })}\n\nCurrently selected: ${maxTickets}\nPress continue to proceed with selected value`,
                      ),
                  ],
                });
              }
            });
            ticketsCollector.on('end', async (_, reason) => {
              if (reason !== 'continue') {
                return await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.timeout', { lng }))],
                  components: [],
                });
              }
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
