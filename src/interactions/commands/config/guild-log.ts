import {
  ApplicationIntegrationType,
  channelMention,
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder
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
  getGuildLog
} from 'db/guild-log';

import { RECOMMENDED_DISABLED_GUILD_LOG_EVENTS, RECOMMENDED_ENABLED_GUILD_LOG_EVENTS, VALID_GUILD_LOG_EVENTS } from 'constants/guild-log';

import type { GuildLogEvent } from 'types/guild-log';
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
          ...VALID_GUILD_LOG_EVENTS.map((event) => ({ name: event, value: event }))
        ].slice(0, 25)
      );
      return;
    }

    await interaction.respond(
      [{ name: 'all', value: 'all' }, { name: 'recommended', value: 'recommended' }, ...VALID_GUILD_LOG_EVENTS.map((event) => ({ name: event, value: event }))]
        .filter((e) => e.name.toLowerCase().includes(event.toLowerCase()))
        .slice(0, 25)
    );
  },
  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const { options, guild } = interaction;

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as GuildLogEvent[] };

    if (options.getSubcommandGroup() === 'events') {
      if (options.getSubcommand() === 'enable') {
        const event = options.getString('event', true);
        const channel = options.getChannel('channel', true, [ChannelType.GuildText]);

        if (![...VALID_GUILD_LOG_EVENTS, 'all', 'recommended'].includes(event)) {
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
          await enableGuildLogEvents(guild.id, VALID_GUILD_LOG_EVENTS, channel.id);
        } else if (event === 'recommended') {
          await enableGuildLogEvents(guild.id, RECOMMENDED_ENABLED_GUILD_LOG_EVENTS, channel.id);
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

        if (![...VALID_GUILD_LOG_EVENTS, 'all', 'recommended'].includes(event)) {
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
            VALID_GUILD_LOG_EVENTS.map((e) => ({ name: e, channelId: log.events.find((ev) => ev.name === e)?.channelId }))
          );
        } else if (event === 'recommended') {
          await disableGuildLogEvents(
            guild.id,
            RECOMMENDED_DISABLED_GUILD_LOG_EVENTS.map((e) => ({ name: e, channelId: log.events.find((ev) => ev.name === e)?.channelId }))
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
      const unconfiguredEvents = VALID_GUILD_LOG_EVENTS.filter((event) => !log.events.find((e) => e.name === event));

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
                ? enabledEvents.map((e) => `${e.name}: ${guild.channels.cache.get(e.channelId) ? channelMention(e.channelId) : e.channelId}`).join('\n')
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
          // .addFields(
          //   { name: t('log.state.title', { lng }), value: log.enabled ? t('enabled', { lng }) : t('disabled', { lng }) },
          //   {
          //     name: t('log.events.title-enabled', { lng }),
          //     value: enabledEvents.length
          //       ? enabledEvents.map((e) => `${e.name}: ${guild.channels.cache.get(e.channelId) ? channelMention(e.channelId) : e.channelId}`).join('\n')
          //       : t('none', { lng })
          //   }
          // {
          //   name: t('log.events.title-disabled', { lng }),
          //   value: disabledEvents.length ? disabledEvents.map((e) => e.name).join('\n') : t('none', { lng })
          // },
          // {
          //   name: t('log.events.title-unconfigured', { lng }),
          //   value: unconfiguredEvents.length ? unconfiguredEvents.join('\n') : t('none', { lng })
          // }
          // )
        ]
      });
    }
  }
});
