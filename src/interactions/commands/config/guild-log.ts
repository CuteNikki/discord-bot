import {
  ApplicationIntegrationType,
  channelMention,
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  roleMention,
  SlashCommandBuilder,
  userMention
} from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import {
  disableGuildLog,
  disableGuildLogEvent,
  disableGuildLogEvents,
  enableGuildLog,
  enableGuildLogEvent,
  enableGuildLogEvents,
  getGuildLog,
  setGuildLogEvent
} from 'db/guild-log';

import { EVENT_DEFINITIONS, EVENT_RECOMMENDATIONS_DISABLED, EVENT_RECOMMENDATIONS_ENABLED, EVENT_VALIDATION } from 'constants/guild-log';

import type { LoggedEvent } from 'types/guild-log';
import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Config,
  data: new SlashCommandBuilder()
    .setName('log')
    .setDescription('Configure guild logs')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addSubcommandGroup((group) =>
      group
        .setName('events')
        .setDescription('Configure events')
        .addSubcommand((cmd) =>
          cmd
            .setName('details')
            .setDescription('Shows more info about an event')
            .addStringOption((option) => option.setName('event').setDescription('Event name').setRequired(true).setAutocomplete(true))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('enable')
            .setDescription('Enable event')
            .addStringOption((option) => option.setName('event').setDescription('Event name').setRequired(true).setAutocomplete(true))
            .addChannelOption((option) => option.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('disable')
            .setDescription('Disable event')
            .addStringOption((option) => option.setName('event').setDescription('Event name').setRequired(true).setAutocomplete(true))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('set-channel')
            .setDescription('Set channel for event')
            .addStringOption((option) => option.setName('event').setDescription('Event name').setRequired(true).setAutocomplete(true))
            .addChannelOption((option) => option.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('ignore-user')
            .setDescription('Add user to ignore list')
            .addStringOption((option) => option.setName('event').setDescription('Event name').setRequired(true).setAutocomplete(true))
            .addUserOption((option) => option.setName('user').setDescription('User').setRequired(true))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('unignore-user')
            .setDescription('Remove user from ignore list')
            .addStringOption((option) => option.setName('event').setDescription('Event name').setRequired(true).setAutocomplete(true))
            .addStringOption((option) => option.setName('user-id').setDescription('User').setRequired(true))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('ignore-role')
            .setDescription('Add role to ignore list')
            .addStringOption((option) => option.setName('event').setDescription('Event name').setRequired(true).setAutocomplete(true))
            .addRoleOption((option) => option.setName('role').setDescription('Role').setRequired(true))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('unignore-role')
            .setDescription('Remove role from ignore list')
            .addStringOption((option) => option.setName('event').setDescription('Event name').setRequired(true).setAutocomplete(true))
            .addStringOption((option) => option.setName('role-id').setDescription('Role').setRequired(true))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('ignore-channel')
            .setDescription('Add channel to ignore list')
            .addStringOption((option) => option.setName('event').setDescription('Event name').setRequired(true).setAutocomplete(true))
            .addChannelOption((option) => option.setName('channel').setDescription('Channel').setRequired(true))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('unignore-channel')
            .setDescription('Remove channel from ignore list')
            .addStringOption((option) => option.setName('event').setDescription('Event name').setRequired(true).setAutocomplete(true))
            .addStringOption((option) => option.setName('channel-id').setDescription('Channel').setRequired(true))
        )
    )
    .addSubcommand((cmd) => cmd.setName('enable').setDescription('Enable logs module'))
    .addSubcommand((cmd) => cmd.setName('disable').setDescription('Disable logs module'))
    .addSubcommand((cmd) => cmd.setName('info').setDescription('Shows current log configuration')),
  async autocomplete({ interaction }) {
    const event = interaction.options.getFocused();

    if (!event.length) {
      await interaction.respond(
        [
          { name: 'all', value: 'all' },
          { name: 'recommended', value: 'recommended' },
          ...EVENT_VALIDATION.map((event) => ({ name: event, value: event }))
        ].slice(0, 25)
      );
      return;
    }

    await interaction.respond(
      [{ name: 'all', value: 'all' }, { name: 'recommended', value: 'recommended' }, ...EVENT_VALIDATION.map((event) => ({ name: event, value: event }))]
        .filter((e) => e.name.toLowerCase().includes(event.toLowerCase()))
        .slice(0, 25)
    );
  },
  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const { options, guild } = interaction;

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as LoggedEvent[] };

    if (options.getSubcommandGroup() === 'events') {
      if (options.getSubcommand() === 'details') {
        const event = options.getString('event', true);

        if (!EVENT_VALIDATION.includes(event)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.invalid', { lng }))]
          });
          return;
        }

        const foundEvent = log.events.find((e) => e.name === event);

        if (!foundEvent) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.not-found', { lng }))]
          });
          return;
        }

        return interaction.editReply({
          embeds: [
            new EmbedBuilder().setColor(client.colors.general).addFields(
              { name: t('log.details.event', { lng }), value: foundEvent.name },
              { name: t('log.details.state', { lng }), value: foundEvent.enabled ? t('enabled', { lng }) : t('disabled', { lng }) },
              {
                name: t('log.details.channel', { lng }),
                value:
                  foundEvent.channelId && guild.channels.cache.get(foundEvent.channelId)
                    ? channelMention(foundEvent.channelId)
                    : foundEvent.channelId
                      ? foundEvent.channelId
                      : t('none', { lng })
              },
              {
                name: t('log.details.ignored-users', { lng }),
                value: foundEvent.excludedUsers?.length
                  ? foundEvent.excludedUsers.map((u) => (guild.members.cache.get(u) ? userMention(u) : u)).join(', ')
                  : t('none', { lng })
              },
              {
                name: t('log.details.ignored-roles', { lng }),
                value: foundEvent.excludedRoles?.length
                  ? foundEvent.excludedRoles.map((r) => (guild.roles.cache.get(r) ? roleMention(r) : r)).join(', ')
                  : t('none', { lng })
              },
              {
                name: t('log.details.ignored-channels', { lng }),
                value: foundEvent.excludedChannels?.length
                  ? foundEvent.excludedChannels.map((c) => (guild.channels.cache.get(c) ? channelMention(c) : c)).join(', ')
                  : t('none', { lng })
              }
            )
          ]
        });
      }

      if (options.getSubcommand() === 'set-channel') {
        const event = options.getString('event', true);
        const channel = options.getChannel('channel', true, [ChannelType.GuildText]);

        if (!EVENT_VALIDATION.includes(event)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.invalid', { lng }))]
          });
          return;
        }

        if (!channel.permissionsFor(guild.members.me!)?.has(PermissionFlagsBits.SendMessages)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.missing-permissions', { lng }))]
          });
          return;
        }

        const foundEvent = log.events.find((e) => e.name === event);

        if (foundEvent?.channelId === channel.id) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.channel-same', { lng }))]
          });
          return;
        }

        if (foundEvent) await setGuildLogEvent(guild.id, { ...foundEvent, channelId: channel.id });
        else await setGuildLogEvent(guild.id, { name: event, channelId: channel.id });

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.general).setDescription(t('log.events.channel-set', { lng, channel: channel.toString() }))]
        });
      }

      if (options.getSubcommand() === 'ignore-user') {
        const event = options.getString('event', true);
        const user = options.getUser('user', true);

        if (!EVENT_VALIDATION.includes(event)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.invalid', { lng }))]
          });
          return;
        }

        const foundDefinition = EVENT_DEFINITIONS.find((e) => e.name === event);

        if (!foundDefinition?.canExcludeUsers) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.cannot-ignore-user', { lng }))]
          });
          return;
        }

        if (foundDefinition?.canExcludeBotsOnly && !user.bot) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.cannot-ignore-user', { lng }))]
          });
          return;
        }

        const foundEvent = log.events.find((e) => e.name === event);

        if (foundEvent?.includedUsers?.includes(user.id)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.already-ignored-user', { lng }))]
          });
          return;
        }

        if (foundEvent) await setGuildLogEvent(guild.id, { ...foundEvent, excludedUsers: [...(foundEvent.excludedUsers ?? []), user.id] });
        else await setGuildLogEvent(guild.id, { name: event, excludedUsers: [user.id] });

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.general).setDescription(t('log.events.user-ignored', { lng }))]
        });
      }

      if (options.getSubcommand() === 'unignore-user') {
        const event = options.getString('event', true);
        const userId = options.getString('user-id', true);

        if (!EVENT_VALIDATION.includes(event)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.invalid', { lng }))]
          });
          return;
        }

        const foundEvent = log.events.find((e) => e.name === event);

        if (!foundEvent || !foundEvent.excludedUsers?.includes(userId)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.user-not-ignored', { lng }))]
          });
          return;
        }

        await setGuildLogEvent(guild.id, { ...foundEvent, excludedUsers: (foundEvent.excludedUsers ?? []).filter((u) => u !== userId) });

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.general).setDescription(t('log.events.user-unignored', { lng }))]
        });
      }

      if (options.getSubcommand() === 'ignore-role') {
        const event = options.getString('event', true);
        const role = options.getRole('role', true);

        if (!EVENT_VALIDATION.includes(event)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.invalid', { lng }))]
          });
          return;
        }

        const foundDefinition = EVENT_DEFINITIONS.find((e) => e.name === event);

        if (!foundDefinition?.canExcludeRoles) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.cannot-ignore-role', { lng }))]
          });
          return;
        }

        const foundEvent = log.events.find((e) => e.name === event);

        if (foundEvent?.includedRoles?.includes(role.id)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.already-ignored-role', { lng }))]
          });
          return;
        }

        if (foundEvent) await setGuildLogEvent(guild.id, { ...foundEvent, excludedRoles: [...(foundEvent.excludedRoles ?? []), role.id] });
        else await setGuildLogEvent(guild.id, { name: event, excludedRoles: [role.id] });

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.general).setDescription(t('log.events.role-ignored', { lng }))]
        });
      }

      if (options.getSubcommand() === 'unignore-role') {
        const event = options.getString('event', true);
        const roleId = options.getString('role-id', true);

        if (!EVENT_VALIDATION.includes(event)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.invalid', { lng }))]
          });
          return;
        }

        const foundEvent = log.events.find((e) => e.name === event);

        if (!foundEvent || !foundEvent.excludedRoles?.includes(roleId)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.role-not-ignored', { lng }))]
          });
          return;
        }

        await setGuildLogEvent(guild.id, { ...foundEvent, excludedRoles: (foundEvent.excludedRoles ?? []).filter((r) => r !== roleId) });

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.general).setDescription(t('log.events.role-unignored', { lng }))]
        });
      }

      if (options.getSubcommand() === 'ignore-channel') {
        const event = options.getString('event', true);
        const channel = options.getChannel('channel', true);

        if (!EVENT_VALIDATION.includes(event)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.invalid', { lng }))]
          });
          return;
        }

        const foundDefinition = EVENT_DEFINITIONS.find((e) => e.name === event);

        if (!foundDefinition?.canExcludeChannels) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.cannot-ignore-channel', { lng }))]
          });
          return;
        }

        if (foundDefinition?.excludableChannelTypes && !foundDefinition.excludableChannelTypes.includes(channel.type)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.invalid-channel', { lng }))]
          });
          return;
        }

        const foundEvent = log.events.find((e) => e.name === event);

        if (foundEvent?.includedChannels?.includes(channel.id)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.already-ignored-channel', { lng }))]
          });
          return;
        }

        if (foundEvent) await setGuildLogEvent(guild.id, { ...foundEvent, excludedChannels: [...(foundEvent.excludedChannels ?? []), channel.id] });
        else await setGuildLogEvent(guild.id, { name: event, excludedChannels: [channel.id] });

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.general).setDescription(t('log.events.channel-ignored', { lng }))]
        });
      }

      if (options.getSubcommand() === 'unignore-channel') {
        const event = options.getString('event', true);
        const channelId = options.getString('channel-id', true);

        if (!EVENT_VALIDATION.includes(event)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.invalid', { lng }))]
          });
          return;
        }

        const foundEvent = log.events.find((e) => e.name === event);

        if (!foundEvent || !foundEvent.excludedChannels?.includes(channelId)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.not-ignored-channel', { lng }))]
          });
          return;
        }

        await setGuildLogEvent(guild.id, { ...foundEvent, excludedChannels: (foundEvent.excludedChannels ?? []).filter((c) => c !== channelId) });

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.general).setDescription(t('log.events.channel-unignored', { lng }))]
        });
      }

      if (options.getSubcommand() === 'enable') {
        const event = options.getString('event', true);
        const channel = options.getChannel('channel', true, [ChannelType.GuildText]);

        if (![...EVENT_VALIDATION, 'all', 'recommended'].includes(event)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.invalid', { lng }))]
          });
          return;
        }

        if (!['all', 'recommended'].includes(event)) {
          if (log.events.find((e) => e.name === event)?.enabled) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.already-enabled', { lng }))]
            });
            return;
          }
        }

        if (!channel.permissionsFor(guild.members.me!)?.has(PermissionFlagsBits.SendMessages)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.missing-permissions', { lng }))]
          });
          return;
        }

        if (event === 'all') {
          await enableGuildLogEvents(guild.id, EVENT_VALIDATION, channel.id);
        } else if (event === 'recommended') {
          await enableGuildLogEvents(guild.id, EVENT_RECOMMENDATIONS_DISABLED, channel.id);
        } else {
          await enableGuildLogEvent(guild.id, event, channel.id);
        }

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.general).setDescription(t('log.events.enabled', { lng }))]
        });
        return;
      }

      if (options.getSubcommand() === 'disable') {
        const event = options.getString('event', true);

        if (![...EVENT_VALIDATION, 'all', 'recommended'].includes(event)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.invalid', { lng }))]
          });
          return;
        }

        if (!['all', 'recommended'].includes(event)) {
          const foundEvent = log.events.find((e) => e.name === event);
          if (foundEvent && foundEvent.enabled === false) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.events.already-disabled', { lng }))]
            });
            return;
          }
        }

        if (event === 'all') {
          await disableGuildLogEvents(
            guild.id,
            EVENT_VALIDATION.map((e) => ({ name: e, channelId: log.events.find((ev) => ev.name === e)?.channelId }))
          );
        } else if (event === 'recommended') {
          await disableGuildLogEvents(
            guild.id,
            EVENT_RECOMMENDATIONS_ENABLED.map((e) => ({ name: e, channelId: log.events.find((ev) => ev.name === e)?.channelId }))
          );
        } else {
          await disableGuildLogEvent(guild.id, event);
        }

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.general).setDescription(t('log.events.disabled', { lng }))]
        });
        return;
      }
    }

    if (options.getSubcommand() === 'enable') {
      if (log.enabled) {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.state.already-enabled', { lng }))]
        });
        return;
      }

      await enableGuildLog(guild.id);

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.general).setDescription(t('log.state.enabled', { lng }))]
      });
    }

    if (options.getSubcommand() === 'disable') {
      if (!log.enabled) {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('log.state.already-disabled', { lng }))]
        });
        return;
      }

      await disableGuildLog(guild.id);

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.general).setDescription(t('log.state.disabled', { lng }))]
      });
    }

    if (options.getSubcommand() === 'info') {
      const enabledEvents = log.events.filter((event) => event.enabled && event.channelId);
      const disabledEvents = log.events.filter((event) => !event.enabled);
      const unconfiguredEvents = EVENT_VALIDATION.filter((event) => !log.events.find((e) => e.name === event));

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.colors.general)
            .setTitle(t('log.title', { lng }))
            .addFields({
              name: t('log.state.title', { lng }),
              value: log.enabled ? t('enabled', { lng }) : t('disabled', { lng })
            }),
          new EmbedBuilder()
            .setColor(client.colors.general)
            .setTitle(t('log.events.title-enabled', { lng }))
            .setDescription(
              enabledEvents.length
                ? enabledEvents
                    .map((e) => `${e.name}: ${e.channelId && guild.channels.cache.get(e.channelId) ? channelMention(e.channelId) : e.channelId}`)
                    .join('\n')
                : t('none', { lng })
            ),
          new EmbedBuilder()
            .setColor(client.colors.general)
            .setTitle(t('log.events.title-disabled', { lng }))
            .setDescription(disabledEvents.length ? disabledEvents.map((e) => e.name).join('\n') : t('none', { lng })),
          new EmbedBuilder()
            .setColor(client.colors.general)
            .setTitle(t('log.events.title-unconfigured', { lng }))
            .setDescription(unconfiguredEvents.length ? unconfiguredEvents.join('\n') : t('none', { lng }))
        ]
      });
    }
  }
});
