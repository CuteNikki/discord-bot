import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';
import mongoose from 'mongoose';

import { Command, Contexts, IntegrationTypes } from 'classes/command';

export default new Command({
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
                  i18next.t('botinfo.general.name', { lng, name: application.name, id: application.id }),
                  i18next.t('botinfo.general.owner', { lng, owner: `<@${application.owner?.id}>`, id: application.owner?.id }),
                  i18next.t('botinfo.general.created', { lng, created: `<t:${Math.floor(application.createdTimestamp / 1000)}:D>` }),
                ].join('\n'),
              },
              {
                name: i18next.t('botinfo.stats.title', { lng }),
                value: [i18next.t('botinfo.stats.guilds', { lng, guildCount }), i18next.t('botinfo.stats.members', { lng, memberCount })].join('\n'),
              },
              {
                name: i18next.t('botinfo.database.title', { lng }),
                value: [
                  i18next.t('botinfo.database.name', { lng, name: 'MongoDB' }),
                  i18next.t('botinfo.database.state', { lng, state: dbStates[mongoose.connection.readyState] }),
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
