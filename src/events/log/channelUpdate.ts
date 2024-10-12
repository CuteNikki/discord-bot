import { ChannelType, Colors, EmbedBuilder, Events, ThreadAutoArchiveDuration, VideoQualityMode } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuild } from 'db/guild';
import { getGuildLanguage } from 'db/language';

export default new Event({
  name: Events.ChannelUpdate,
  once: false,
  async execute(_client, oldChannel, newChannel) {
    if (oldChannel.isDMBased() || newChannel.isDMBased()) return;
    const guild = newChannel.guild;

    const config = (await getGuild(guild.id)) ?? { log: { enabled: false } };

    if (!config.log.enabled || !config.log.events.channelUpdate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = await getGuildLanguage(guild.id);

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.channelUpdate.title', { lng }))
      .addFields({
        name: t('log.channelUpdate.channel', { lng }),
        value: `${newChannel.toString()} (\`${newChannel.name}\` | ${newChannel.id})`
      })
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newChannel.name !== oldChannel.name)
      embed.addFields(
        {
          name: t('log.channelUpdate.old-name', { lng }),
          value: `\`${oldChannel.name}\``,
          inline: true
        },
        {
          name: t('log.channelUpdate.new-name', { lng }),
          value: `\`${newChannel.name}\``,
          inline: true
        },
        emptyField
      );
    if (newChannel.position !== oldChannel.position)
      embed.addFields(
        {
          name: t('log.channelUpdate.old-position', { lng }),
          value: `${oldChannel.position}`,
          inline: true
        },
        {
          name: t('log.channelUpdate.new-position', { lng }),
          value: `${newChannel.position}`,
          inline: true
        },
        emptyField
      );
    if (newChannel.type !== oldChannel.type)
      embed.addFields(
        {
          name: t('log.channelUpdate.old-type', { lng }),
          value: `${ChannelType[oldChannel.type]}`,
          inline: true
        },
        {
          name: t('log.channelUpdate.new-type', { lng }),
          value: `${ChannelType[newChannel.type]}`,
          inline: true
        },
        emptyField
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
          name: t('log.channelUpdate.old-permission-overwrites', { lng }),
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
                  }`
              )
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true
        },
        {
          name: t('log.channelUpdate.new-permission-overwrites', { lng }),
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
                  }`
              )
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true
        },
        emptyField
      );

    if (
      (newChannel.type === ChannelType.GuildText || newChannel.type === ChannelType.GuildAnnouncement) &&
      (oldChannel.type === ChannelType.GuildText || oldChannel.type === ChannelType.GuildAnnouncement)
    ) {
      if (newChannel.topic !== oldChannel.topic)
        embed.addFields(
          {
            name: t('log.channelUpdate.old-topic', { lng }),
            value: `${oldChannel.topic?.slice(0, 1000) || '/'}`,
            inline: true
          },
          {
            name: t('log.channelUpdate.new-topic', { lng }),
            value: `${newChannel.topic?.slice(0, 1000) || '/'}`,
            inline: true
          },
          emptyField
        );
      if (newChannel.nsfw !== oldChannel.nsfw)
        embed.addFields(
          {
            name: t('log.channelUpdate.old-nsfw', { lng }),
            value: `${newChannel.nsfw}`,
            inline: true
          },
          {
            name: t('log.channelUpdate.new-nsfw', { lng }),
            value: `${oldChannel.nsfw}`,
            inline: true
          },
          emptyField
        );
      if ((newChannel.rateLimitPerUser || 0) !== (oldChannel.rateLimitPerUser || 0))
        embed.addFields(
          {
            name: t('log.channelUpdate.old-rate-limit', { lng }),
            value: `${oldChannel.rateLimitPerUser || '0'}s`,
            inline: true
          },
          {
            name: t('log.channelUpdate.new-rate-limit', { lng }),
            value: `${newChannel.rateLimitPerUser || '0'}s`,
            inline: true
          },
          emptyField
        );
      if ((newChannel.defaultAutoArchiveDuration || 4320) !== (oldChannel.defaultAutoArchiveDuration || 4320))
        embed.addFields(
          {
            name: t('log.channelUpdate.old-auto-archive-duration', { lng }),
            value: `${ThreadAutoArchiveDuration[oldChannel.defaultAutoArchiveDuration || 4320]}`,
            inline: true
          },
          {
            name: t('log.channelUpdate.new-auto-archive-duration', { lng }),
            value: `${ThreadAutoArchiveDuration[newChannel.defaultAutoArchiveDuration || 4320]}`,
            inline: true
          },
          emptyField
        );
    }
    if (
      (newChannel.type === ChannelType.GuildVoice || newChannel.type === ChannelType.GuildStageVoice) &&
      (oldChannel.type === ChannelType.GuildVoice || oldChannel.type === ChannelType.GuildStageVoice)
    ) {
      if (newChannel.nsfw !== oldChannel.nsfw)
        embed.addFields(
          {
            name: t('log.channelUpdate.old-nsfw', { lng }),
            value: `${newChannel.nsfw}`,
            inline: true
          },
          {
            name: t('log.channelUpdate.new-nsfw', { lng }),
            value: `${oldChannel.nsfw}`,
            inline: true
          },
          emptyField
        );
      if (newChannel.rateLimitPerUser !== oldChannel.rateLimitPerUser)
        embed.addFields(
          {
            name: t('log.channelUpdate.old-rate-limit', { lng }),
            value: `${oldChannel.rateLimitPerUser || '0'}s`,
            inline: true
          },
          {
            name: t('log.channelUpdate.new-rate-limit', { lng }),
            value: `${newChannel.rateLimitPerUser || '0'}s`,
            inline: true
          },
          emptyField
        );
      if (newChannel.bitrate !== oldChannel.bitrate)
        embed.addFields(
          {
            name: t('log.channelUpdate.old-bitrate', { lng }),
            value: `${oldChannel.bitrate}`,
            inline: true
          },
          {
            name: t('log.channelUpdate.new-bitrate', { lng }),
            value: `${newChannel.bitrate}`,
            inline: true
          },
          emptyField
        );
      if (newChannel.rtcRegion !== oldChannel.rtcRegion)
        embed.addFields(
          {
            name: t('log.channelUpdate.old-region', { lng }),
            value: `${oldChannel.rtcRegion || 'Automatic'}`,
            inline: true
          },
          {
            name: t('log.channelUpdate.new-region', { lng }),
            value: `${newChannel.rtcRegion || 'Automatic'}`,
            inline: true
          },
          emptyField
        );
      if (newChannel.userLimit !== oldChannel.userLimit)
        embed.addFields(
          {
            name: t('log.channelUpdate.old-user-limit', { lng }),
            value: `${oldChannel.userLimit}`,
            inline: true
          },
          {
            name: t('log.channelUpdate.new-user-limit', { lng }),
            value: `${newChannel.userLimit}`,
            inline: true
          },
          emptyField
        );
      if (newChannel.videoQualityMode !== oldChannel.videoQualityMode)
        embed.addFields(
          {
            name: t('log.channelUpdate.old-video-quality', { lng }),
            value: `${VideoQualityMode[oldChannel.videoQualityMode || 1]}`,
            inline: true
          },
          {
            name: t('log.channelUpdate.new-video-quality', { lng }),
            value: `${VideoQualityMode[newChannel.videoQualityMode || 1]}`,
            inline: true
          },
          emptyField
        );
    }

    const embedData = embed.toJSON();
    if (!embedData.fields?.length || embedData.fields.length > 25 || embedData.fields.length <= 1) return;

    await logChannel.send({
      embeds: [embed]
    });
  }
});
