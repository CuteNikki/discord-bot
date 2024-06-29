import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder, version } from 'discord.js';
import i18next from 'i18next';
import mongoose from 'mongoose';
import osu from 'node-os-utils';

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';

import { clientModel } from 'models/client';

export default new Command({
  module: Modules.GENERAL,
  data: {
    name: 'botinfo',
    description: 'Shows information about the bot',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD, Contexts.BOT_DM, Contexts.PRIVATE_CHANNEL],
    integration_types: [IntegrationTypes.GUILD_INSTALL, IntegrationTypes.USER_INSTALL],
    options: [
      {
        name: 'ephemeral',
        description: 'When set to false will show the message to everyone',
        type: ApplicationCommandOptionType.Boolean,
      },
    ],
  },
  async execute({ interaction, client }) {
    const lng = await client.getLanguage(interaction.user.id);
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

      const clientDatabaseSettings = await clientModel
        .findOneAndUpdate({ clientId: interaction.client.user.id }, {}, { upsert: true, new: true })
        .lean()
        .exec();

      const dbStates = {
        0: i18next.t('botinfo.database.disconnected', { lng }),
        1: i18next.t('botinfo.database.connected', { lng }),
        2: i18next.t('botinfo.database.connecting', { lng }),
        3: i18next.t('botinfo.database.disconnecting', { lng }),
        99: i18next.t('botinfo.database.uninitialized', { lng }),
      };

      const guildCount = ((await client.cluster.fetchClientValues('guilds.cache.size')) as number[]).reduce((acc, count) => acc + count, 0);
      const memberCount = ((await client.cluster.broadcastEval((c) => c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0))) as number[]).reduce(
        (acc, count) => acc + count,
        0
      );

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setThumbnail(interaction.client.user.displayAvatarURL({ size: 4096 }))
            .setTitle(i18next.t('botinfo.title', { lng }))
            .addFields(
              {
                name: i18next.t('botinfo.general.title', { lng }),
                value: [
                  i18next.t('botinfo.general.owner', { lng, owner: `<@${application.owner?.id}>`, id: application.owner?.id }),
                  i18next.t('botinfo.general.created', { lng, created: `<t:${Math.floor(application.createdTimestamp / 1000)}:D>` }),
                  i18next.t('botinfo.general.ping', { lng, ping: client.ws.ping }),
                  i18next.t('botinfo.general.uptime', { lng, uptime: `<t:${Math.floor(interaction.client.readyTimestamp / 1000)}:R>` }),
                ].join('\n'),
              },
              {
                name: i18next.t('botinfo.stats.title', { lng }),
                value: [
                  i18next.t('botinfo.stats.guilds', { lng, guildCount }),
                  i18next.t('botinfo.stats.members', { lng, memberCount }),
                  i18next.t('botinfo.stats.commands', { lng, commandCount: commands.size }),
                ].join('\n'),
              },
              {
                name: i18next.t('botinfo.system.title', { lng }),
                value: [
                  i18next.t('botinfo.system.os', { lng, operatingSystem }),
                  i18next.t('botinfo.system.cpu_model', { lng, cpuModel }),
                  i18next.t('botinfo.system.cpu_usage', { lng, cpuUsage }),
                  i18next.t('botinfo.system.mem_usage', { lng, memoryUsage, memoryUsed, memoryTotal }),
                  i18next.t('botinfo.system.node', { lng, version: process.version }),
                  i18next.t('botinfo.system.discord', { lng, version }),
                ].join('\n'),
              },
              {
                name: i18next.t('botinfo.database.title', { lng }),
                value: [
                  i18next.t('botinfo.database.name', { lng, name: 'MongoDB' }),
                  i18next.t('botinfo.database.state', { lng, state: dbStates[mongoose.connection.readyState] }),
                  i18next.t('botinfo.database.weekly', {
                    lng,
                    date: clientDatabaseSettings.lastWeeklyLevelClear ? `<t:${Math.floor(clientDatabaseSettings.lastWeeklyLevelClear / 1000)}:F>` : '/',
                  }),
                ].join('\n'),
              }
            ),
        ],
      });
    } catch (err) {
      interaction.editReply(i18next.t('botinfo.failed', { lng }));
    }
  },
});
