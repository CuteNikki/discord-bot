import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';
import mongoose from 'mongoose';
import nou from 'node-os-utils';
import os from 'os';

import { Command, Context, IntegrationTypes } from 'classes/command';

export default new Command({
  data: {
    name: 'botinfo',
    description: 'Shows information about the bot',
    type: ApplicationCommandType.ChatInput,
    contexts: [Context.GUILD, Context.BOT_DM, Context.PRIVATE_CHANNEL],
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
    if (!interaction.isChatInputCommand()) return;
    const lng = client.getLanguage(interaction.user.id);
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    try {
      const application = await interaction.client.application.fetch();

      const dbStates = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting',
        99: 'Uninitialized',
      };

      const operatingSystem = os.type();
      const cpuModel = nou.cpu.model();
      const cpuUsage = await nou.cpu.usage();
      const memInfo = await nou.mem.info();
      const totalMemGb = Math.floor(memInfo.totalMemMb / 1000);
      const usedMemGb = Math.floor(memInfo.usedMemMb / 1000);
      const usedMemPercentage = Math.floor(memInfo.usedMemPercentage);

      let guildCount = client.guilds.cache.size;
      let userCount = client.users.cache.size;
      let channelCount = client.channels.cache.size;
      let emojiCount = client.emojis.cache.size;
      if (client.shard) {
        guildCount = ((await client.shard.fetchClientValues('guilds.cache.size')) as number[]).reduce((acc, count) => acc + count, 0);
        userCount = ((await client.shard.fetchClientValues('users.cache.size')) as number[]).reduce((acc, count) => acc + count, 0);
        channelCount = ((await client.shard.fetchClientValues('channels.cache.size')) as number[]).reduce((acc, count) => acc + count, 0);
        emojiCount = ((await client.shard.fetchClientValues('emojis.cache.size')) as number[]).reduce((acc, count) => acc + count, 0);
      }

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
                  i18next.t('botinfo.general.name', { lng, name: application.name, id: application.id }),
                  i18next.t('botinfo.general.owner', { lng, owner: `<@${application.owner?.id}>`, id: application.owner?.id }),
                  i18next.t('botinfo.general.created', { lng, created: `<t:${Math.floor(application.createdTimestamp / 1000)}:D>` }),
                  i18next.t('botinfo.general.uptime', { lng, uptime: `<t:${Math.floor(interaction.client.readyTimestamp / 1000)}:R>` }),
                  i18next.t('botinfo.general.ping', { lng, ping: client.ws.ping }),
                ].join('\n'),
              },
              {
                name: i18next.t('botinfo.vps.title', { lng }),
                value: [
                  i18next.t('botinfo.vps.os', { lng, os: operatingSystem }),
                  i18next.t('botinfo.vps.cpu_model', { lng, cpuModel }),
                  i18next.t('botinfo.vps.cpu_usage', { lng, cpuUsage }),
                  i18next.t('botinfo.vps.ram_usage', { lng, usedMemGb, totalMemGb, usedMemPercentage }),
                ].join('\n'),
              },
              {
                name: i18next.t('botinfo.stats.title', { lng }),
                value: [
                  i18next.t('botinfo.stats.db_name', { lng, name: 'MongoDB' }),
                  i18next.t('botinfo.stats.db_state', { lng, state: dbStates[mongoose.connection.readyState] }),
                  i18next.t('botinfo.stats.guilds', { lng, guildCount }),
                  i18next.t('botinfo.stats.users', { lng, userCount }),
                  i18next.t('botinfo.stats.channels', { lng, channelCount }),
                  i18next.t('botinfo.stats.emojis', { lng, emojiCount }),
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
