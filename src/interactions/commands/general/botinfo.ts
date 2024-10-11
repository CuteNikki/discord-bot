import {
  ApplicationIntegrationType,
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
  Team,
  time,
  TimestampStyles,
  userMention,
  version
} from 'discord.js';
import { t } from 'i18next';
import mongoose from 'mongoose';
import osu from 'node-os-utils';

import { Command, ModuleType } from 'classes/command';

import { getClientSettings } from 'db/client';

import { keys } from 'constants/keys';
import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.General,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Shows information about the bot')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to false will show the message to everyone')),
  async execute({ interaction, client, lng }) {
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    try {
      const application = await interaction.client.application.fetch();
      const commands = await interaction.client.application.commands.fetch();

      const operatingSystem = osu.os.type().replace('Windows_NT', 'Windows').replace('Darwin', 'MacOS');
      const cpuModel = osu.cpu.model();
      const cpuUsage = Math.round(await osu.cpu.usage());
      const memoryInfo = await osu.mem.info();
      const memoryUsage = Math.round(memoryInfo.usedMemPercentage);
      const memoryUsed = (memoryInfo.usedMemMb / 1024).toFixed(2);
      const memoryTotal = Math.round(memoryInfo.totalMemMb / 1024);

      const { database, stats } = (await getClientSettings(keys.DISCORD_BOT_ID)) ?? {
        database: { lastWeeklyClearAt: null },
        stats: { buttonsExecuted: 0, buttonsFailed: 0, commandsExecuted: 0, commandsFailed: 0, guildsJoined: 0, guildsLeft: 0 }
      };

      const dbStates = {
        0: t('botinfo.database.disconnected', { lng }),
        1: t('botinfo.database.connected', { lng }),
        2: t('botinfo.database.connecting', { lng }),
        3: t('botinfo.database.disconnecting', { lng }),
        99: t('botinfo.database.uninitialized', { lng })
      };

      const guildCount = ((await client.cluster.fetchClientValues('guilds.cache.size')) as number[]).reduce((acc, count) => acc + count, 0);
      const memberCount = ((await client.cluster.broadcastEval((c) => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0))) as number[]).reduce(
        (acc, count) => acc + count,
        0
      );

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.colors.general)
            .setThumbnail(interaction.client.user.displayAvatarURL({ size: 4096 }))
            .setTitle(t('botinfo.title', { lng }))
            .addFields(
              {
                name: t('botinfo.general.title', { lng }),
                value: [
                  t('botinfo.general.owner', {
                    lng,
                    owner: application.owner
                      ? application.owner instanceof Team
                        ? `${userMention(application.owner.ownerId!)} | ${application.owner.members.get(application.owner.ownerId!)?.user.username}\n${application.owner.ownerId}`
                        : `${userMention(application.owner.id)} | ${application.owner.username}\n${application.owner.id})`
                      : t('none', { lng })
                  }),
                  t('botinfo.general.created', {
                    lng,
                    created: `${time(Math.floor(application.createdTimestamp / 1000), TimestampStyles.LongDate)} | ${time(Math.floor(application.createdTimestamp / 1000), TimestampStyles.RelativeTime)}`
                  }),
                  t('botinfo.general.uptime', {
                    lng,
                    uptime: time(Math.floor(interaction.client.readyTimestamp / 1000), TimestampStyles.RelativeTime)
                  }),
                  t('botinfo.general.ping', { lng, ping: client.ws.ping.toString() })
                ].join('\n')
              },
              {
                name: t('botinfo.system.title', { lng }),
                value: [
                  t('botinfo.system.os', { lng, operatingSystem }),
                  t('botinfo.system.cpu-model', { lng, cpuModel }),
                  t('botinfo.system.cpu-usage', { lng, cpuUsage: cpuUsage.toString() }),
                  t('botinfo.system.mem-usage', {
                    lng,
                    memoryUsage,
                    memoryUsed,
                    memoryTotal
                  }),
                  t('botinfo.system.node', { lng, version: process.version }),
                  t('botinfo.system.discord', { lng, version })
                ].join('\n')
              },
              {
                name: t('botinfo.database.title', { lng }),
                value: [
                  t('botinfo.database.state', {
                    lng,
                    state: dbStates[mongoose.connection.readyState]
                  }),
                  t('botinfo.database.weekly', {
                    lng,
                    date: database.lastWeeklyClearAt ? time(Math.floor(database.lastWeeklyClearAt / 1000), TimestampStyles.RelativeTime) : t('none', { lng })
                  })
                ].join('\n')
              },
              {
                name: t('botinfo.stats.title', { lng }),
                value: [
                  t('botinfo.stats.guilds', { lng, guildCount: guildCount.toString() }),
                  t('botinfo.stats.members', { lng, memberCount: memberCount.toString() }),
                  t('botinfo.stats.commands', {
                    lng,
                    commandCount: commands.size.toString()
                  }),
                  t('botinfo.stats.executed-commands', {
                    lng,
                    executedCommands: stats.commandsExecuted.toString()
                  }),
                  t('botinfo.stats.failed-commands', {
                    lng,
                    failedCommands: stats.commandsFailed.toString()
                  }),
                  t('botinfo.stats.buttons-executed', {
                    lng,
                    buttonsExecuted: stats.buttonsExecuted.toString()
                  }),
                  t('botinfo.stats.buttons-failed', {
                    lng,
                    buttonsFailed: stats.buttonsFailed.toString()
                  }),
                  t('botinfo.stats.guilds-joined', {
                    lng,
                    guildsJoined: stats.guildsJoined.toString()
                  }),
                  t('botinfo.stats.guilds-left', {
                    lng,
                    guildsLeft: stats.guildsLeft.toString()
                  })
                ].join('\n')
              }
            )
        ]
      });
    } catch (err: unknown) {
      logger.debug({ err }, 'Could not send botinfo');
      interaction.editReply(t('botinfo.failed', { lng }));
    }
  }
});
