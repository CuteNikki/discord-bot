import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType, SlashCommandBuilder, Team, version } from 'discord.js';
import { t } from 'i18next';
import mongoose from 'mongoose';
import osu from 'node-os-utils';

import { Command, ModuleType } from 'classes/command';

import { keys } from 'utils/keys';

export default new Command({
  module: ModuleType.General,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Shows information about the bot')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to false will show the message to everyone')),
  async execute({ interaction, client }) {
    const lng = await client.getUserLanguage(interaction.user.id);
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

      const { database } = await client.getClientSettings(keys.DISCORD_BOT_ID);

      const dbStates = {
        0: t('botinfo.database.disconnected', { lng }),
        1: t('botinfo.database.connected', { lng }),
        2: t('botinfo.database.connecting', { lng }),
        3: t('botinfo.database.disconnecting', { lng }),
        99: t('botinfo.database.uninitialized', { lng }),
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
            .setTitle(t('botinfo.title', { lng }))
            .addFields(
              {
                name: t('botinfo.general.title', { lng }),
                value: [
                  t('botinfo.general.owner', {
                    lng,
                    owner:
                      application.owner instanceof Team
                        ? `<@${application.owner.ownerId}> (\`${application.owner.members.get(application.owner.ownerId ?? '')?.user.username}\` | ${
                            application.owner.ownerId
                          })`
                        : `<@${application.owner?.id}> (\`${application.owner?.username}\` | ${application.owner?.id})`,
                  }),
                  t('botinfo.general.created', { lng, created: `<t:${Math.floor(application.createdTimestamp / 1000)}:D>` }),
                  t('botinfo.general.ping', { lng, ping: client.ws.ping }),
                  t('botinfo.general.uptime', { lng, uptime: `<t:${Math.floor(interaction.client.readyTimestamp / 1000)}:R>` }),
                ].join('\n'),
              },
              {
                name: t('botinfo.stats.title', { lng }),
                value: [
                  t('botinfo.stats.guilds', { lng, guildCount }),
                  t('botinfo.stats.members', { lng, memberCount }),
                  t('botinfo.stats.commands', { lng, commandCount: commands.size }),
                ].join('\n'),
              },
              {
                name: t('botinfo.system.title', { lng }),
                value: [
                  t('botinfo.system.os', { lng, operatingSystem }),
                  t('botinfo.system.cpu_model', { lng, cpuModel }),
                  t('botinfo.system.cpu_usage', { lng, cpuUsage }),
                  t('botinfo.system.mem_usage', { lng, memoryUsage, memoryUsed, memoryTotal }),
                  t('botinfo.system.node', { lng, version: process.version }),
                  t('botinfo.system.discord', { lng, version }),
                ].join('\n'),
              },
              {
                name: t('botinfo.database.title', { lng }),
                value: [
                  t('botinfo.database.name', { lng, name: 'MongoDB' }),
                  t('botinfo.database.state', { lng, state: dbStates[mongoose.connection.readyState] }),
                  t('botinfo.database.weekly', {
                    lng,
                    date: database.lastWeeklyClear ? `<t:${Math.floor(database.lastWeeklyClear / 1000)}:F>` : '/',
                  }),
                ].join('\n'),
              }
            ),
        ],
      });
    } catch (err) {
      interaction.editReply(t('botinfo.failed', { lng }));
    }
  },
});
