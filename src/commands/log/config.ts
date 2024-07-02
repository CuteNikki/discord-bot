import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, Colors, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';

import { availableEvents, guildModel } from 'models/guild';

export default new Command({
  module: Modules.CONFIG,
  data: {
    name: 'config-log',
    description: 'Configure the log module',
    default_member_permissions: `${PermissionFlagsBits.ManageGuild}`,
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
    options: [
      {
        name: 'show',
        description: 'Shows the current configuration',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'all',
            description: 'Shows the entire configuration',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'channel',
            description: 'Shows the log channel',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'events',
            description: 'Shows the events',
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
      {
        name: 'channel',
        description: 'Configure the log channel',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'set',
            description: 'Sets the log channel',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'channel',
                description: 'The log channel',
                type: ApplicationCommandOptionType.Channel,
                channel_types: [ChannelType.GuildText],
                required: true,
              },
            ],
          },
          {
            name: 'remove',
            description: 'Removes the log channel',
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
      {
        name: 'events',
        description: 'Manage the events',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'enable',
            description: 'Enables an event',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'event',
                description: 'Name of the event',
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
                required: true,
              },
            ],
          },
          {
            name: 'disable',
            description: 'Disables an event',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'event',
                description: 'Name of the event',
                type: ApplicationCommandOptionType.String,
                autocomplete: true,
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
  async autocomplete({ interaction }) {
    const eventName = interaction.options.getFocused();
    if (!eventName.length)
      return interaction.respond(
        [
          { name: 'all events', value: 'all' },
          { name: 'recommended events', value: 'recommended' },
          ...availableEvents.sort((a, b) => a.localeCompare(b)).map((event) => ({ name: event, value: event })),
        ].slice(0, 25)
      );
    await interaction.respond(
      [
        { name: 'all events', value: 'all' },
        { name: 'recommended events', value: 'recommended' },
        ...availableEvents.sort((a, b) => a.localeCompare(b)).map((event) => ({ name: event, value: event })),
      ]
        .filter((event) => event.name.toLowerCase().includes(eventName.toLowerCase()))
        .slice(0, 25)
    );
  },
  async execute({ client, interaction }) {
    if (!interaction.inCachedGuild()) return;
    const { options, guildId } = interaction;
    await interaction.deferReply({ ephemeral: true });
    const lng = await client.getLanguage(interaction.user.id);

    const config = await client.getGuildSettings(guildId);
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
                  .setTitle(i18next.t('log.title', { lng }))
                  .setDescription(events.map((e) => `${e.name}: ${e.enabled}`).join('\n'))
                  .addFields({
                    name: i18next.t('log.channel.title', { lng }),
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
                      .setTitle(i18next.t('log.title', { lng }))
                      .addFields({
                        name: i18next.t('log.channel.title', { lng }),
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
                      .setTitle(i18next.t('log.title', { lng }))
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
                  const newSettings = await guildModel
                    .findOneAndUpdate(
                      { guildId },
                      {
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
                      },
                      { new: true, upsert: true }
                    )
                    .lean()
                    .exec();
                  client.guildSettings.set(guildId, newSettings);

                  return interaction.editReply(i18next.t('log.events.enabled', { lng }));
                }
                if (eventName.toLowerCase() === 'all') {
                  const newSettings = await guildModel
                    .findOneAndUpdate(
                      { guildId },
                      {
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
                      },
                      { new: true, upsert: true }
                    )
                    .lean()
                    .exec();
                  client.guildSettings.set(guildId, newSettings);

                  return interaction.editReply(i18next.t('log.events.enabled', { lng }));
                }

                if (!event) return interaction.editReply(i18next.t('log.events.invalid', { lng }));
                if (event.enabled) return interaction.editReply(i18next.t('log.events.already_enabled', { lng }));

                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $set: { [`log.events.${event.name}`]: true } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('log.events.enabled', { lng }));
              }
              break;
            case 'disable':
              {
                const eventName = options.getString('event', true);
                const event = events.find((e) => e.name.toLowerCase() === eventName.toLowerCase());

                if (eventName.toLowerCase() === 'recommended') {
                  const newSettings = await guildModel
                    .findOneAndUpdate(
                      { guildId },
                      {
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
                      },
                      { new: true, upsert: true }
                    )
                    .lean()
                    .exec();
                  client.guildSettings.set(guildId, newSettings);

                  return interaction.editReply(i18next.t('log.events.disabled', { lng }));
                }
                if (eventName.toLowerCase() === 'all') {
                  const newSettings = await guildModel
                    .findOneAndUpdate(
                      { guildId },
                      {
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
                      },
                      { new: true, upsert: true }
                    )
                    .lean()
                    .exec();
                  client.guildSettings.set(guildId, newSettings);

                  return interaction.editReply(i18next.t('log.events.disabled', { lng }));
                }

                if (!event) return interaction.editReply(i18next.t('log.events.invalid', { lng }));
                if (!event.enabled) return interaction.editReply(i18next.t('log.events.already_disabled', { lng }));

                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $set: { [`log.events.${event.name}`]: false } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('log.events.disabled', { lng }));
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
                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $set: { ['log.channelId']: channel.id } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('log.channel.set', { lng }));
              }
              break;
            case 'remove':
              {
                if (!config.log.channelId) return interaction.editReply(i18next.t('log.channel.none', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $set: { ['log.channelId']: undefined } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('log.channel.removed', { lng }));
              }
              break;
          }
        }
        break;
    }
  },
});
