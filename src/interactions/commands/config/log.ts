import { ApplicationIntegrationType, ChannelType, Colors, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { getGuildSettings, updateGuildSettings } from 'db/guild';

import { availableEvents } from 'types/guild';

export default new Command({
  module: ModuleType.Config,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('config-log')
    .setDescription('Configure the log module')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addSubcommandGroup((group) =>
      group
        .setName('show')
        .setDescription('Shows the current configuration')
        .addSubcommand((subcommand) => subcommand.setName('all').setDescription('Shows the entire configuration'))
        .addSubcommand((subcommand) => subcommand.setName('channel').setDescription('Shows the log channel'))
        .addSubcommand((subcommand) => subcommand.setName('events').setDescription('Shows the events')),
    )
    .addSubcommandGroup((group) =>
      group
        .setName('channel')
        .setDescription('Configure the log channel')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('set')
            .setDescription('Sets the log channel')
            .addChannelOption((option) => option.setName('channel').setDescription('The log channel').setRequired(true).addChannelTypes(ChannelType.GuildText)),
        )
        .addSubcommand((subcommand) => subcommand.setName('remove').setDescription('Removes the log channel')),
    )
    .addSubcommandGroup((group) =>
      group
        .setName('events')
        .setDescription('Manage the events')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('enable')
            .setDescription('Enables an event')
            .addStringOption((option) => option.setName('event').setDescription('Name of the event').setAutocomplete(true).setRequired(true)),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('disable')
            .setDescription('Disables an event')
            .addStringOption((option) => option.setName('event').setDescription('Name of the event').setAutocomplete(true).setRequired(true)),
        ),
    ),
  async autocomplete({ interaction }) {
    const eventName = interaction.options.getFocused();
    if (!eventName.length)
      return interaction.respond(
        [
          { name: 'all events', value: 'all' },
          { name: 'recommended events', value: 'recommended' },
          ...availableEvents.sort((a, b) => a.localeCompare(b)).map((event) => ({ name: event, value: event })),
        ].slice(0, 25),
      );
    await interaction.respond(
      [
        { name: 'all events', value: 'all' },
        { name: 'recommended events', value: 'recommended' },
        ...availableEvents.sort((a, b) => a.localeCompare(b)).map((event) => ({ name: event, value: event })),
      ]
        .filter((event) => event.name.toLowerCase().includes(eventName.toLowerCase()))
        .slice(0, 25),
    );
  },
  async execute({ interaction, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const { options, guildId } = interaction;

    const config = await getGuildSettings(guildId);
    const events = availableEvents
      .map((eventName) => ({
        name: eventName,
        enabled: config.log.events[eventName as keyof typeof config.log.events],
      }))
      .sort((a, b) => Number(b.enabled) - Number(a.enabled));

    switch (options.getSubcommandGroup()) {
      case 'show':
        {
          switch (options.getSubcommand()) {
            case 'all':
              {
                const allConfigEmbed = new EmbedBuilder()
                  .setColor(Colors.Orange)
                  .setTitle(t('log.title', { lng }))
                  .setDescription(events.map((e) => `${e.name}: ${e.enabled}`).join('\n'))
                  .addFields({
                    name: t('log.channel.title', { lng }),
                    value: config.log.channelId ? `<#${config.log.channelId}>` : '/',
                  });
                interaction.editReply({ embeds: [allConfigEmbed] });
              }
              break;
            case 'channel':
              {
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(Colors.Blurple)
                      .setTitle(t('log.title', { lng }))
                      .addFields({
                        name: t('log.channel.title', { lng }),
                        value: config.log.channelId ? `<#${config.log.channelId}>` : '/',
                      }),
                  ],
                });
              }
              break;
            case 'events':
              {
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(Colors.Blurple)
                      .setTitle(t('log.title', { lng }))
                      .setDescription(events.map((e) => `${e.name}: ${e.enabled}`).join('\n')),
                  ],
                });
              }
              break;
          }
        }
        break;
      case 'events':
        {
          switch (options.getSubcommand()) {
            case 'enable':
              {
                const eventName = options.getString('event', true);
                const event = events.find((e) => e.name.toLowerCase() === eventName.toLowerCase());

                if (eventName.toLowerCase() === 'recommended') {
                  await updateGuildSettings(guildId, {
                    $set: {
                      ['log.events']: {
                        applicationCommandPermissionsUpdate: config.log.events.applicationCommandPermissionsUpdate,
                        autoModerationActionExecution: config.log.events.autoModerationActionExecution,
                        autoModerationRuleCreate: config.log.events.autoModerationRuleCreate,
                        autoModerationRuleDelete: config.log.events.autoModerationRuleDelete,
                        autoModerationRuleUpdate: config.log.events.autoModerationRuleUpdate,
                        channelCreate: true,
                        channelDelete: true,
                        channelUpdate: true,
                        emojiCreate: true,
                        emojiDelete: true,
                        emojiUpdate: true,
                        guildBanAdd: true,
                        guildBanRemove: true,
                        guildMemberAdd: true,
                        guildMemberRemove: true,
                        guildMemberUpdate: true,
                        guildScheduledEventCreate: config.log.events.guildScheduledEventCreate,
                        guildScheduledEventDelete: config.log.events.guildScheduledEventDelete,
                        guildScheduledEventUpdate: config.log.events.guildScheduledEventUpdate,
                        guildScheduledEventUserAdd: config.log.events.guildScheduledEventUserAdd,
                        guildScheduledEventUserRemove: config.log.events.guildScheduledEventUserRemove,
                        guildUpdate: true,
                        inviteCreate: config.log.events.inviteCreate,
                        inviteDelete: config.log.events.inviteDelete,
                        messageUpdate: true,
                        messageDelete: true,
                        messageBulkDelete: true,
                        messageReactionRemoveAll: true,
                        roleCreate: true,
                        roleDelete: true,
                        roleUpdate: true,
                        stickerCreate: true,
                        stickerDelete: true,
                        stickerUpdate: true,
                        threadCreate: config.log.events.threadCreate,
                        threadDelete: config.log.events.threadDelete,
                        threadUpdate: config.log.events.threadUpdate,
                        voiceStateUpdate: config.log.events.voiceStateUpdate,
                      },
                    },
                  });
                  return interaction.editReply(t('log.events.enabled', { lng }));
                }
                if (eventName.toLowerCase() === 'all') {
                  await updateGuildSettings(guildId, {
                    $set: {
                      ['log.events']: {
                        applicationCommandPermissionsUpdate: true,
                        autoModerationActionExecution: true,
                        autoModerationRuleCreate: true,
                        autoModerationRuleDelete: true,
                        autoModerationRuleUpdate: true,
                        channelCreate: true,
                        channelDelete: true,
                        channelUpdate: true,
                        emojiCreate: true,
                        emojiDelete: true,
                        emojiUpdate: true,
                        guildBanAdd: true,
                        guildBanRemove: true,
                        guildMemberAdd: true,
                        guildMemberRemove: true,
                        guildMemberUpdate: true,
                        guildScheduledEventCreate: true,
                        guildScheduledEventDelete: true,
                        guildScheduledEventUpdate: true,
                        guildScheduledEventUserAdd: true,
                        guildScheduledEventUserRemove: true,
                        guildUpdate: true,
                        inviteCreate: true,
                        inviteDelete: true,
                        messageUpdate: true,
                        messageDelete: true,
                        messageBulkDelete: true,
                        messageReactionRemoveAll: true,
                        roleCreate: true,
                        roleDelete: true,
                        roleUpdate: true,
                        stickerCreate: true,
                        stickerDelete: true,
                        stickerUpdate: true,
                        threadCreate: true,
                        threadDelete: true,
                        threadUpdate: true,
                        voiceStateUpdate: true,
                      },
                    },
                  });
                  return interaction.editReply(t('log.events.enabled', { lng }));
                }

                if (!event) return interaction.editReply(t('log.events.invalid', { lng }));
                if (event.enabled) return interaction.editReply(t('log.events.already_enabled', { lng }));

                await updateGuildSettings(guildId, {
                  $set: { [`log.events.${event.name}`]: true },
                });
                interaction.editReply(t('log.events.enabled', { lng }));
              }
              break;
            case 'disable':
              {
                const eventName = options.getString('event', true);
                const event = events.find((e) => e.name.toLowerCase() === eventName.toLowerCase());

                if (eventName.toLowerCase() === 'recommended') {
                  await updateGuildSettings(guildId, {
                    $set: {
                      ['log.events']: {
                        applicationCommandPermissionsUpdate: false,
                        autoModerationActionExecution: false,
                        autoModerationRuleCreate: false,
                        autoModerationRuleDelete: false,
                        autoModerationRuleUpdate: false,
                        channelCreate: config.log.events.channelCreate,
                        channelDelete: config.log.events.channelDelete,
                        channelUpdate: config.log.events.channelUpdate,
                        emojiCreate: config.log.events.emojiCreate,
                        emojiDelete: config.log.events.emojiDelete,
                        emojiUpdate: config.log.events.emojiUpdate,
                        guildBanAdd: config.log.events.guildBanAdd,
                        guildBanRemove: config.log.events.guildBanRemove,
                        guildMemberAdd: config.log.events.guildMemberAdd,
                        guildMemberRemove: config.log.events.guildMemberRemove,
                        guildMemberUpdate: config.log.events.guildMemberUpdate,
                        guildScheduledEventCreate: false,
                        guildScheduledEventDelete: false,
                        guildScheduledEventUpdate: false,
                        guildScheduledEventUserAdd: false,
                        guildScheduledEventUserRemove: false,
                        guildUpdate: config.log.events.guildUpdate,
                        inviteCreate: false,
                        inviteDelete: false,
                        messageUpdate: config.log.events.messageUpdate,
                        messageDelete: config.log.events.messageDelete,
                        messageBulkDelete: config.log.events.messageBulkDelete,
                        messageReactionRemoveAll: config.log.events.messageReactionRemoveAll,
                        roleCreate: config.log.events.roleCreate,
                        roleDelete: config.log.events.roleDelete,
                        roleUpdate: config.log.events.roleUpdate,
                        stickerCreate: config.log.events.stickerCreate,
                        stickerDelete: config.log.events.stickerDelete,
                        stickerUpdate: config.log.events.stickerUpdate,
                        threadCreate: false,
                        threadDelete: false,
                        threadUpdate: false,
                        voiceStateUpdate: false,
                      },
                    },
                  });
                  return interaction.editReply(t('log.events.disabled', { lng }));
                }
                if (eventName.toLowerCase() === 'all') {
                  await updateGuildSettings(guildId, {
                    $set: {
                      ['log.events']: {
                        applicationCommandPermissionsUpdate: false,
                        autoModerationActionExecution: false,
                        autoModerationRuleCreate: false,
                        autoModerationRuleDelete: false,
                        autoModerationRuleUpdate: false,
                        channelCreate: false,
                        channelDelete: false,
                        channelUpdate: false,
                        emojiCreate: false,
                        emojiDelete: false,
                        emojiUpdate: false,
                        guildBanAdd: false,
                        guildBanRemove: false,
                        guildMemberAdd: false,
                        guildMemberRemove: false,
                        guildMemberUpdate: false,
                        guildScheduledEventCreate: false,
                        guildScheduledEventDelete: false,
                        guildScheduledEventUpdate: false,
                        guildScheduledEventUserAdd: false,
                        guildScheduledEventUserRemove: false,
                        guildUpdate: false,
                        inviteCreate: false,
                        inviteDelete: false,
                        messageUpdate: false,
                        messageDelete: false,
                        messageBulkDelete: false,
                        messageReactionRemoveAll: false,
                        roleCreate: false,
                        roleDelete: false,
                        roleUpdate: false,
                        stickerCreate: false,
                        stickerDelete: false,
                        stickerUpdate: false,
                        threadCreate: false,
                        threadDelete: false,
                        threadUpdate: false,
                        voiceStateUpdate: false,
                      },
                    },
                  });
                  return interaction.editReply(t('log.events.disabled', { lng }));
                }

                if (!event) return interaction.editReply(t('log.events.invalid', { lng }));
                if (!event.enabled) return interaction.editReply(t('log.events.already_disabled', { lng }));

                await updateGuildSettings(guildId, {
                  $set: { [`log.events.${event.name}`]: false },
                });
                interaction.editReply(t('log.events.disabled', { lng }));
              }
              break;
          }
        }
        break;
      case 'channel':
        {
          switch (options.getSubcommand()) {
            case 'set':
              {
                const channel = options.getChannel('channel', true, [ChannelType.GuildText]);
                await updateGuildSettings(guildId, {
                  $set: { ['log.channelId']: channel.id },
                });
                interaction.editReply(t('log.channel.set', { lng }));
              }
              break;
            case 'remove':
              {
                if (!config.log.channelId) return interaction.editReply(t('log.channel.none', { lng }));
                await updateGuildSettings(guildId, {
                  $set: { ['log.channelId']: undefined },
                });
                interaction.editReply(t('log.channel.removed', { lng }));
              }
              break;
          }
        }
        break;
    }
  },
});
