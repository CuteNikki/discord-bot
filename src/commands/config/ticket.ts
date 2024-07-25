import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

export default new Command({
  module: ModuleType.Config,
  data: new SlashCommandBuilder()
    .setName('config-ticket')
    .setDescription('Configure the ticket module')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommandGroup((group) =>
      group
        .setName('show')
        .setDescription('Shows the current configuration of the ticket module')
        .addSubcommand((subcommand) => subcommand.setName('all').setDescription('Shows the entire configuration'))
        .addSubcommand((subcommand) => subcommand.setName('state').setDescription('Check the ticket module state'))
        .addSubcommand((subcommand) => subcommand.setName('systems').setDescription('Show the ticket systems'))
    )
    .addSubcommandGroup((group) =>
      group
        .setName('toggle')
        .setDescription('Toggle the ticket module')
        .addSubcommand((subcommand) => subcommand.setName('on').setDescription('Enable the ticket module'))
        .addSubcommand((subcommand) => subcommand.setName('off').setDescription('Disable the ticket module'))
    )
    .addSubcommandGroup((group) =>
      group
        .setName('systems')
        .setDescription('Configure the ticket systems')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('create')
            .setDescription('Create a new ticket system')
            .addRoleOption((option) => option.setName('staff-role').setDescription('The role of staff members to take care of tickets').setRequired(true))
            .addChannelOption((option) =>
              option
                .setName('transcript-channel')
                .setDescription('The channel to send transcripts to')
                .setRequired(false)
                .addChannelTypes(ChannelType.GuildText)
            )
            .addChannelOption((option) =>
              option.setName('category').setDescription('The category to create tickets in').setRequired(false).addChannelTypes(ChannelType.GuildCategory)
            )
            .addIntegerOption((option) =>
              option
                .setName('max-tickets')
                .setDescription('Max amount of tickets a member can have open at once')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(25)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('edit')
            .setDescription('Edit a ticket system')
            .addStringOption((option) => option.setName('id').setDescription('The id of the ticket system to edit').setRequired(true))
            .addRoleOption((option) => option.setName('staff-role').setDescription('The role of staff members to take care of tickets').setRequired(false))
            .addChannelOption((option) =>
              option
                .setName('transcript-channel')
                .setDescription('The channel to send transcripts to')
                .setRequired(false)
                .addChannelTypes(ChannelType.GuildText)
            )
            .addChannelOption((option) =>
              option.setName('category').setDescription('The category to create tickets in').setRequired(false).addChannelTypes(ChannelType.GuildCategory)
            )
            .addIntegerOption((option) =>
              option
                .setName('max-tickets')
                .setDescription('Max amount of tickets a member can have open at once')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(25)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('delete')
            .setDescription('Delete a ticket system')
            .addStringOption((option) => option.setName('id').setDescription('The id of the ticket system to delete').setRequired(true))
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('add-choice')
            .setDescription('Add a choice to a ticket system')
            .addStringOption((option) => option.setName('id').setDescription('The id of the ticket system to add a choice to').setRequired(true))
            .addStringOption((option) => option.setName('choice').setDescription('The choice to add').setRequired(true).setMaxLength(80))
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('remove-choice')
            .setDescription('Remove a choice from a ticket system')
            .addStringOption((option) => option.setName('id').setDescription('The id of the ticket system to remove a choice from').setRequired(true))
            .addStringOption((option) => option.setName('choice').setDescription('The choice to remove').setRequired(true))
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('send')
            .setDescription('Send a ticket system')
            .addStringOption((option) => option.setName('id').setDescription('The id of the ticket system to delete').setRequired(true))
            .addChannelOption((option) => option.setName('channel').setDescription('The channel to send the ticket system to').setRequired(true))
        )
    ),
  async execute({ client, interaction }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply({ ephemeral: true });

    const { options, guild, user } = interaction;
    const lng = await client.getUserLanguage(user.id);

    const currentConfig = await client.getGuildSettings(guild.id);

    switch (options.getSubcommandGroup()) {
      case 'show':
        {
          switch (options.getSubcommand()) {
            case 'all':
              {
                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder().setTitle(t('tickets.title', { lng })).addFields({
                      name: t('tickets.state', { lng }),
                      value: `${currentConfig.ticket.enabled}`,
                      inline: true,
                    }),
                    ...currentConfig.ticket.systems.map((system) =>
                      new EmbedBuilder().addFields(
                        { name: t('tickets.id', { lng }), value: system._id.toString() },
                        {
                          name: t('tickets.staff_role', { lng }),
                          value: `<@&${system.staffRoleId}>`,
                        },
                        {
                          name: t('tickets.transcript_channel', { lng }),
                          value: system.transcriptChannelId ? `<#${system.transcriptChannelId}>` : '/',
                        },
                        {
                          name: t('tickets.category', { lng }),
                          value: system.parentChannelId ? `<#${system.parentChannelId}>` : '/',
                        },
                        {
                          name: t('tickets.max_tickets', { lng }),
                          value: system.maxTickets.toString(),
                        }
                      )
                    ),
                  ],
                });
              }
              break;
            case 'state':
              {
                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder().setDescription(t('tickets.title', { lng })).addFields({
                      name: t('tickets.state', { lng }),
                      value: `${currentConfig.ticket.enabled}`,
                      inline: true,
                    }),
                  ],
                });
              }
              break;
            case 'systems':
              {
                if (!currentConfig.ticket.systems.length) return await interaction.editReply({ content: 'No ticket systems have been created' });
                await interaction.editReply({
                  embeds: currentConfig.ticket.systems.map((system) =>
                    new EmbedBuilder().addFields(
                      { name: t('tickets.id', { lng }), value: system._id.toString() },
                      {
                        name: t('tickets.staff_role', { lng }),
                        value: `<@&${system.staffRoleId}>`,
                      },
                      {
                        name: t('tickets.transcript_channel', { lng }),
                        value: system.transcriptChannelId ? `<#${system.transcriptChannelId}>` : '/',
                      },
                      {
                        name: t('tickets.category', { lng }),
                        value: system.parentChannelId ? `<#${system.parentChannelId}>` : '/',
                      },
                      {
                        name: t('tickets.max_tickets', { lng }),
                        value: system.maxTickets.toString(),
                      }
                    )
                  ),
                });
              }
              break;
          }
        }
        break;
      case 'toggle':
        {
          switch (options.getSubcommand()) {
            case 'on':
              {
                if (currentConfig.ticket.enabled) return await interaction.editReply({ content: 'The ticket module is already enabled' });
                await client.updateGuildSettings(guild.id, { $set: { ['ticket.enabled']: true } });
                await interaction.editReply({ content: t('tickets.enabled', { lng }) });
              }
              break;
            case 'off':
              {
                if (!currentConfig.ticket.enabled) return await interaction.editReply({ content: 'The ticket module is already disabled' });
                await client.updateGuildSettings(guild.id, { $set: { ['ticket.enabled']: false } });
                await interaction.editReply({ content: t('tickets.disabled', { lng }) });
              }
              break;
          }
        }
        break;
      case 'systems': {
        switch (options.getSubcommand()) {
          case 'create':
            {
              if (currentConfig.ticket.systems.length >= 10) return await interaction.editReply({ content: 'The ticket system limit has been reached' });

              const staffRole = options.getRole('staff-role', true);
              const transcriptChannel = options.getChannel('transcript-channel', false);
              const category = options.getChannel('category', false);
              const maxTickets = options.getInteger('max-tickets', false);

              const config = await client.updateGuildSettings(guild.id, {
                $push: {
                  ['ticket.systems']: {
                    staffRoleId: staffRole.id,
                    transcriptChannelId: transcriptChannel?.id ?? null,
                    parentChannelId: category?.id ?? null,
                    maxTickets: maxTickets ?? 5,
                  },
                },
              });

              await interaction.editReply({
                content: t('tickets.created', { lng, id: config.ticket.systems[config.ticket.systems.length - 1]._id.toString() }),
              });
            }
            break;
          case 'edit':
            {
              const id = options.getString('id', true);
              const staffRole = options.getRole('staff-role', false);
              const transcriptChannel = options.getChannel('transcript-channel', false);
              const category = options.getChannel('category', false);
              const maxTickets = options.getInteger('max-tickets', false);

              const system = currentConfig.ticket.systems.find((system) => system._id.toString() === id);
              if (!system) return await interaction.editReply({ content: 'The ticket system does not exist' });

              await client.updateGuildSettings(guild.id, {
                $set: {
                  ['ticket.systems']: currentConfig.ticket.systems.map((system) => {
                    if (system._id.toString() === id) {
                      return {
                        ...system,
                        staffRoleId: staffRole?.id ?? system.staffRoleId,
                        transcriptChannelId: transcriptChannel?.id ?? system.transcriptChannelId,
                        parentChannelId: category?.id ?? system.parentChannelId,
                        maxTickets: maxTickets ?? system.maxTickets,
                      };
                    }
                    return system;
                  }),
                },
              });

              await interaction.editReply({ content: t('tickets.edited', { lng }) });
            }
            break;
          case 'delete':
            {
              await client.updateGuildSettings(guild.id, {
                $pull: {
                  ['ticket.systems']: {
                    _id: options.getString('id', true),
                  },
                },
              });
              await interaction.editReply({ content: t('tickets.deleted', { lng }) });
            }
            break;
          case 'add-choice':
            {
              const id = options.getString('id', true);
              const choice = options.getString('choice', true);

              const system = currentConfig.ticket.systems.find((system) => system._id.toString() === id);
              if (!system) return await interaction.editReply({ content: t('tickets.invalid', { lng }) });
              if (system.choices.includes(choice)) return await interaction.editReply({ content: t('tickets.choice_already', { lng }) });
              if (system.choices.length >= 5) return await interaction.editReply({ content: t('tickets.choice_limit', { lng }) });

              await client.updateGuildSettings(guild.id, {
                $set: {
                  ['ticket.systems']: currentConfig.ticket.systems.map((system) => {
                    if (system._id.toString() === id) {
                      return {
                        ...system,
                        choices: system.choices.concat(choice),
                      };
                    }
                    return system;
                  }),
                },
              });

              await interaction.editReply({ content: t('tickets.choice_added', { lng }) });
            }
            break;
          case 'remove-choice':
            {
              const id = options.getString('id', true);
              const choice = options.getString('choice', true);

              const system = currentConfig.ticket.systems.find((system) => system._id.toString() === id);
              if (!system) return await interaction.editReply({ content: t('tickets.invalid', { lng }) });
              if (!system.choices.includes(choice)) return await interaction.editReply({ content: t('tickets.choice_invalid', { lng }) });

              await client.updateGuildSettings(guild.id, {
                $set: {
                  ['ticket.systems']: currentConfig.ticket.systems.map((system) => {
                    if (system._id.toString() === id) {
                      return {
                        ...system,
                        choices: system.choices.filter((c) => c !== choice),
                      };
                    }
                    return system;
                  }),
                },
              });

              await interaction.editReply({ content: t('tickets.choice_removed', { lng }) });
            }
            break;
          case 'send':
            {
              const id = options.getString('id', true);
              const channel = options.getChannel('channel', true);
              if (!channel || channel.type !== ChannelType.GuildText) return await interaction.editReply({ content: 'The channel is invalid' });

              const system = currentConfig.ticket.systems.find((system) => system._id.toString() === id);
              if (!system) return await interaction.editReply({ content: t('tickets.invalid', { lng }) });
              if (!system.choices.length) return await interaction.editReply({ content: t('tickets.no_choices', { lng }) });

              const guildLng = currentConfig.language;

              const msg = await channel
                .send({
                  embeds: [
                    new EmbedBuilder()
                      .setTitle(t('tickets.create_title', { lng: guildLng }))
                      .setDescription(t('tickets.create_description', { lng: guildLng })),
                  ],
                  components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                      system.choices.map((choice, index) =>
                        new ButtonBuilder().setCustomId(`tickets-create_${system._id.toString()}_${index}`).setLabel(choice).setStyle(ButtonStyle.Secondary)
                      )
                    ),
                  ],
                })
                .catch(() => {});
              if (!msg) return await interaction.editReply({ content: t('tickets.send_fail', { lng }) });
              await interaction.editReply({ content: t('tickets.send_success', { lng }) });
            }
            break;
        }
        break;
      }
    }
  },
});
