import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder, Status } from 'discord.js';
import ms from 'ms';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';

import { pagination } from 'utils/pagination';

export default new Command({
  module: Modules.GENERAL,
  data: {
    name: 'clusters',
    description: 'Shows info about all clusters and shards',
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
    const lng = await client.getUserLanguage(interaction.user.id);
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const clusterData = await client.cluster.broadcastEval((c) => {
      return {
        clusterId: c.cluster.id,
        shardIds: [...c.cluster.ids.keys()],
        totalGuilds: c.guilds.cache.size,
        totalMembers: c.guilds.cache.map((g) => g.memberCount).reduce((a, b) => a + b, 0),
        ping: c.ws.ping,
        uptime: c.uptime,
        memoryUsage: Object.fromEntries(
          Object.entries(process.memoryUsage()).map((d) => {
            d[1] = Math.floor((d[1] / 1024 / 1024) * 100) / 100; // format to MB
            return d;
          })
        ),
        allGuildsData: c.guilds.cache.map((guild) => {
          return {
            shardId: guild.shardId,
            id: guild.id,
            name: guild.name,
            ownerId: guild.ownerId,
            memberCount: guild.memberCount,
            channels: guild.channels.cache.map((c) => {
              return { id: c.id, name: c.name };
            }),
          };
        }),
        perShardData: [...c.cluster.ids.keys()].map((shardId) => {
          return {
            shardId: shardId,
            ping: c.ws.shards.get(shardId)?.ping,
            status: Status[c.ws.shards.get(shardId)?.status as Status],
            guilds: c.guilds.cache.filter((x) => x.shardId === shardId).size,
            members: c.guilds.cache
              .filter((x) => x.shardId === shardId)
              .map((g) => g.memberCount)
              .reduce((a, b) => a + b, 0),
          };
        }),
      };
    });

    const embeds: EmbedBuilder[] = [];
    for (const cluster of clusterData) {
      embeds.push(
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle(i18next.t('clusters.title', { lng, id: cluster.clusterId }))
          .setDescription(
            [
              i18next.t('clusters.pin', { lng }) + '\n',
              i18next.t('clusters.uptime', { lng, uptime: ms(cluster.uptime ?? 0, { long: true }) }),
              i18next.t('clusters.ping', { lng, ping: cluster.ping }),
              i18next.t('clusters.memory', { lng, memory: cluster.memoryUsage.rss }),
              i18next.t('clusters.guilds', { lng, guilds: cluster.totalGuilds }),
              i18next.t('clusters.members', { lng, members: cluster.totalMembers }),
            ].join('\n')
          )
          .addFields(
            cluster.perShardData.map((shard) => {
              return {
                name: i18next.t('clusters.shards.title', { lng, id: `${shard.shardId} ${interaction.guild?.shardId === shard.shardId ? '📍' : ''}` }),
                value: [
                  i18next.t('clusters.shards.status', { lng, status: shard.status }),
                  i18next.t('clusters.shards.ping', { lng, ping: shard.ping }),
                  i18next.t('clusters.shards.guilds', { lng, guilds: shard.guilds }),
                  i18next.t('clusters.shards.members', { lng, members: shard.members }),
                ].join('\n'),
                inline: true,
              };
            })
          )
          .setFooter({ text: i18next.t('clusters.page', { lng, page: cluster.clusterId + 1, pages: clusterData.length }) })
      );
    }

    await pagination({ client, interaction, embeds });
  },
});
