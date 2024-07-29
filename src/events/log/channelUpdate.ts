import { ChannelType, Colors, EmbedBuilder, Events, ThreadAutoArchiveDuration, VideoQualityMode } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

export default new Event({
  name: Events.ChannelUpdate,
  once: false,
  async execute(client, oldChannel, newChannel) {
    if (oldChannel.isDMBased() || newChannel.isDMBased()) return;
    const guild = newChannel.guild;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.channelUpdate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const lng = config.language;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.channelUpdate.title', { lng }))
      .addFields({
        name: t('log.channelUpdate.channel', { lng }),
        value: `${newChannel.toString()} (\`${newChannel.name}\` | ${newChannel.id})`,
      })
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newChannel.name !== oldChannel.name)
      embed.addFields(
        {
          name: t('log.channelUpdate.old_name', { lng }),
          value: `\`${oldChannel.name}\``,
          inline: true,
        },
        {
          name: t('log.channelUpdate.new_name', { lng }),
          value: `\`${newChannel.name}\``,
          inline: true,
        },
        emptyField,
      );
    if (newChannel.position !== oldChannel.position)
      embed.addFields(
        {
          name: t('log.channelUpdate.old_position', { lng }),
          value: `${oldChannel.position}`,
          inline: true,
        },
        {
          name: t('log.channelUpdate.new_position', { lng }),
          value: `${newChannel.position}`,
          inline: true,
        },
        emptyField,
      );
    if (newChannel.type !== oldChannel.type)
      embed.addFields(
        {
          name: t('log.channelUpdate.old_type', { lng }),
          value: `${ChannelType[oldChannel.type]}`,
          inline: true,
        },
        {
          name: t('log.channelUpdate.new_type', { lng }),
          value: `${ChannelType[newChannel.type]}`,
          inline: true,
        },
        emptyField,
      );

    const oldPerms = oldChannel.permissionOverwrites.cache
      .map((p) => p)
      .filter((permission) => !newChannel.permissionOverwrites.cache.map((p) => JSON.stringify(p)).includes(JSON.stringify(permission)));
    const newPerms = newChannel.permissionOverwrites.cache
      .map((p) => p)
      .filter((permission) => !oldChannel.permissionOverwrites.cache.map((p) => JSON.stringify(p)).includes(JSON.stringify(permission)));

    if (oldPerms.length || newPerms.length)
      embed.addFields(
        {
          name: t('log.channelUpdate.old_permission_overwrites', { lng }),
          value:
            oldPerms
              .map(
                (permission) =>
                  `<@${permission.type ? '' : '&'}${permission.id}>${
                    permission.allow.toArray().length
                      ? `\n- ${t('log.channelUpdate.allowed', { lng })}: ` +
                        permission.allow
                          .toArray()
                          .map((perm) => `\`${perm}\``)
                          .join(', ')
                      : ''
                  }${
                    permission.deny.toArray().length
                      ? `\n- ${t('log.channelUpdate.denied', { lng })}: ` +
                        permission.deny
                          .toArray()
                          .map((perm) => `\`${perm}\``)
                          .join(', ')
                      : ''
                  }`,
              )
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true,
        },
        {
          name: t('log.channelUpdate.new_permission_overwrites', { lng }),
          value:
            newPerms
              .map(
                (permission) =>
                  `<@${permission.type ? '' : '&'}${permission.id}>${
                    permission.allow.toArray().length
                      ? `\n- ${t('log.channelUpdate.allowed', { lng })}: ` +
                        permission.allow
                          .toArray()
                          .map((perm) => `\`${perm}\``)
                          .join(', ')
                      : ''
                  }${
                    permission.deny.toArray().length
                      ? `\n- ${t('log.channelUpdate.denied', { lng })}: ` +
                        permission.deny
                          .toArray()
                          .map((perm) => `\`${perm}\``)
                          .join(', ')
                      : ''
                  }`,
              )
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true,
        },
        emptyField,
      );

    if (
      (newChannel.type === ChannelType.GuildText || newChannel.type === ChannelType.GuildAnnouncement) &&
      (oldChannel.type === ChannelType.GuildText || oldChannel.type === ChannelType.GuildAnnouncement)
    ) {
      if (newChannel.topic !== oldChannel.topic)
        embed.addFields(
          {
            name: t('log.channelUpdate.old_topic', { lng }),
            value: `${oldChannel.topic?.slice(0, 1000) || '/'}`,
            inline: true,
          },
          {
            name: t('log.channelUpdate.new_topic', { lng }),
            value: `${newChannel.topic?.slice(0, 1000) || '/'}`,
            inline: true,
          },
          emptyField,
        );
      if (newChannel.nsfw !== oldChannel.nsfw)
        embed.addFields(
          {
            name: t('log.channelUpdate.old_nsfw', { lng }),
            value: `${newChannel.nsfw}`,
            inline: true,
          },
          {
            name: t('log.channelUpdate.new_nsfw', { lng }),
            value: `${oldChannel.nsfw}`,
            inline: true,
          },
          emptyField,
        );
      if ((newChannel.rateLimitPerUser || 0) !== (oldChannel.rateLimitPerUser || 0))
        embed.addFields(
          {
            name: t('log.channelUpdate.old_rate_limit', { lng }),
            value: `${oldChannel.rateLimitPerUser || '0'}s`,
            inline: true,
          },
          {
            name: t('log.channelUpdate.new_rate_limit', { lng }),
            value: `${newChannel.rateLimitPerUser || '0'}s`,
            inline: true,
          },
          emptyField,
        );
      if ((newChannel.defaultAutoArchiveDuration || 4320) !== (oldChannel.defaultAutoArchiveDuration || 4320))
        embed.addFields(
          {
            name: t('log.channelUpdate.old_auto_archive_duration', { lng }),
            value: `${ThreadAutoArchiveDuration[oldChannel.defaultAutoArchiveDuration || 4320]}`,
            inline: true,
          },
          {
            name: t('log.channelUpdate.new_auto_archive_duration', { lng }),
            value: `${ThreadAutoArchiveDuration[newChannel.defaultAutoArchiveDuration || 4320]}`,
            inline: true,
          },
          emptyField,
        );
    }
    if (
      (newChannel.type === ChannelType.GuildVoice || newChannel.type === ChannelType.GuildStageVoice) &&
      (oldChannel.type === ChannelType.GuildVoice || oldChannel.type === ChannelType.GuildStageVoice)
    ) {
      if (newChannel.nsfw !== oldChannel.nsfw)
        embed.addFields(
          {
            name: t('log.channelUpdate.old_nsfw', { lng }),
            value: `${newChannel.nsfw}`,
            inline: true,
          },
          {
            name: t('log.channelUpdate.new_nsfw', { lng }),
            value: `${oldChannel.nsfw}`,
            inline: true,
          },
          emptyField,
        );
      if (newChannel.rateLimitPerUser !== oldChannel.rateLimitPerUser)
        embed.addFields(
          {
            name: t('log.channelUpdate.old_rate_limit', { lng }),
            value: `${oldChannel.rateLimitPerUser || '0'}s`,
            inline: true,
          },
          {
            name: t('log.channelUpdate.new_rate_limit', { lng }),
            value: `${newChannel.rateLimitPerUser || '0'}s`,
            inline: true,
          },
          emptyField,
        );
      if (newChannel.bitrate !== oldChannel.bitrate)
        embed.addFields(
          {
            name: t('log.channelUpdate.old_bitrate', { lng }),
            value: `${oldChannel.bitrate}`,
            inline: true,
          },
          {
            name: t('log.channelUpdate.new_bitrate', { lng }),
            value: `${newChannel.bitrate}`,
            inline: true,
          },
          emptyField,
        );
      if (newChannel.rtcRegion !== oldChannel.rtcRegion)
        embed.addFields(
          {
            name: t('log.channelUpdate.old_region', { lng }),
            value: `${oldChannel.rtcRegion || 'Automatic'}`,
            inline: true,
          },
          {
            name: t('log.channelUpdate.new_region', { lng }),
            value: `${newChannel.rtcRegion || 'Automatic'}`,
            inline: true,
          },
          emptyField,
        );
      if (newChannel.userLimit !== oldChannel.userLimit)
        embed.addFields(
          {
            name: t('log.channelUpdate.old_user_limit', { lng }),
            value: `${oldChannel.userLimit}`,
            inline: true,
          },
          {
            name: t('log.channelUpdate.new_user_limit', { lng }),
            value: `${newChannel.userLimit}`,
            inline: true,
          },
          emptyField,
        );
      if (newChannel.videoQualityMode !== oldChannel.videoQualityMode)
        embed.addFields(
          {
            name: t('log.channelUpdate.old_video_quality', { lng }),
            value: `${VideoQualityMode[oldChannel.videoQualityMode || 1]}`,
            inline: true,
          },
          {
            name: t('log.channelUpdate.new_video_quality', { lng }),
            value: `${VideoQualityMode[newChannel.videoQualityMode || 1]}`,
            inline: true,
          },
          emptyField,
        );
    }

    const embedData = embed.toJSON();
    if (!embedData.fields?.length || embedData.fields.length > 25 || embedData.fields.length <= 1) return;

    await logChannel.send({
      embeds: [embed],
    });
  },
});
