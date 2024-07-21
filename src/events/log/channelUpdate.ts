import { ChannelType, Colors, EmbedBuilder, Events, ThreadAutoArchiveDuration, VideoQualityMode } from 'discord.js';

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

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle('Channel Update')
      .addFields({ name: 'Channel', value: `${newChannel.toString()} (\`${newChannel.name}\` | ${newChannel.id})` });

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newChannel.name !== oldChannel.name)
      embed.addFields(
        { name: 'Old Name', value: `\`${oldChannel.name}\``, inline: true },
        { name: 'New Name', value: `\`${newChannel.name}\``, inline: true },
        emptyField
      );
    if (newChannel.position !== oldChannel.position)
      embed.addFields(
        { name: 'Old Position', value: `${oldChannel.position}`, inline: true },
        { name: 'New Position', value: `${newChannel.position}`, inline: true },
        emptyField
      );
    if (newChannel.type !== oldChannel.type)
      embed.addFields(
        { name: 'Old Type', value: `${ChannelType[oldChannel.type]}`, inline: true },
        { name: 'New Type', value: `${ChannelType[newChannel.type]}`, inline: true },
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
          name: 'Old Permissions',
          value:
            oldPerms
              .map(
                (permission) =>
                  `<@${permission.type ? '' : '&'}${permission.id}>${
                    permission.allow.toArray().length
                      ? `\n- Allowed: ` +
                        permission.allow
                          .toArray()
                          .map((perm) => `\`${perm}\``)
                          .join(', ')
                      : ''
                  }${
                    permission.deny.toArray().length
                      ? `\n- Denied: ` +
                        permission.deny
                          .toArray()
                          .map((perm) => `\`${perm}\``)
                          .join(', ')
                      : ''
                  }`
              )
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true,
        },
        {
          name: 'New Permissions',
          value:
            newPerms
              .map(
                (permission) =>
                  `<@${permission.type ? '' : '&'}${permission.id}>${
                    permission.allow.toArray().length
                      ? `\n- Allowed: ` +
                        permission.allow
                          .toArray()
                          .map((perm) => `\`${perm}\``)
                          .join(', ')
                      : ''
                  }${
                    permission.deny.toArray().length
                      ? `\n- Denied: ` +
                        permission.deny
                          .toArray()
                          .map((perm) => `\`${perm}\``)
                          .join(', ')
                      : ''
                  }`
              )
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true,
        },
        emptyField
      );

    if (
      (newChannel.type === ChannelType.GuildText || newChannel.type === ChannelType.GuildAnnouncement) &&
      (oldChannel.type === ChannelType.GuildText || oldChannel.type === ChannelType.GuildAnnouncement)
    ) {
      if (newChannel.topic !== oldChannel.topic)
        embed.addFields(
          { name: 'Old Topic', value: `${oldChannel.topic?.slice(0, 1000) || '/'}`, inline: true },
          { name: 'New Topic', value: `${newChannel.topic?.slice(0, 1000) || '/'}`, inline: true },
          emptyField
        );
      if (newChannel.nsfw !== oldChannel.nsfw)
        embed.addFields(
          { name: 'Old NSFW', value: `${newChannel.nsfw}`, inline: true },
          { name: 'New NSFW', value: `${oldChannel.nsfw}`, inline: true },
          emptyField
        );
      if ((newChannel.rateLimitPerUser || 0) !== (oldChannel.rateLimitPerUser || 0))
        embed.addFields(
          { name: 'Old Rate Limit', value: `${oldChannel.rateLimitPerUser || '0'}s`, inline: true },
          { name: 'New Rate Limit', value: `${newChannel.rateLimitPerUser || '0'}s`, inline: true },
          emptyField
        );
      if ((newChannel.defaultAutoArchiveDuration || 4320) !== (oldChannel.defaultAutoArchiveDuration || 4320))
        embed.addFields(
          { name: 'Old Auto Archive Duration', value: `${ThreadAutoArchiveDuration[oldChannel.defaultAutoArchiveDuration || 4320]}`, inline: true },
          { name: 'New Auto Archive Duration', value: `${ThreadAutoArchiveDuration[newChannel.defaultAutoArchiveDuration || 4320]}`, inline: true },
          emptyField
        );
    }
    if (
      (newChannel.type === ChannelType.GuildVoice || newChannel.type === ChannelType.GuildStageVoice) &&
      (oldChannel.type === ChannelType.GuildVoice || oldChannel.type === ChannelType.GuildStageVoice)
    ) {
      if (newChannel.nsfw !== oldChannel.nsfw)
        embed.addFields(
          { name: 'Old NSFW', value: `${newChannel.nsfw}`, inline: true },
          { name: 'New NSFW', value: `${oldChannel.nsfw}`, inline: true },
          emptyField
        );
      if (newChannel.rateLimitPerUser !== oldChannel.rateLimitPerUser)
        embed.addFields(
          { name: 'Old Rate Limit', value: `${oldChannel.rateLimitPerUser || '0'}s`, inline: true },
          { name: 'New Rate Limit', value: `${newChannel.rateLimitPerUser || '0'}s`, inline: true },
          emptyField
        );
      if (newChannel.bitrate !== oldChannel.bitrate)
        embed.addFields(
          { name: 'Old Bitrate', value: `${oldChannel.bitrate}`, inline: true },
          { name: 'New Bitrate', value: `${newChannel.bitrate}`, inline: true },
          emptyField
        );
      if (newChannel.rtcRegion !== oldChannel.rtcRegion)
        embed.addFields(
          { name: 'Old Region', value: `${oldChannel.rtcRegion || 'Automatic'}`, inline: true },
          { name: 'New Region', value: `${newChannel.rtcRegion || 'Automatic'}`, inline: true },
          emptyField
        );
      if (newChannel.userLimit !== oldChannel.userLimit)
        embed.addFields(
          { name: 'Old User Limit', value: `${oldChannel.userLimit}`, inline: true },
          { name: 'New User Limit', value: `${newChannel.userLimit}`, inline: true },
          emptyField
        );
      if (newChannel.videoQualityMode !== oldChannel.videoQualityMode)
        embed.addFields(
          { name: 'Old Video Quality', value: `${VideoQualityMode[oldChannel.videoQualityMode || 1]}`, inline: true },
          { name: 'New Video Quality', value: `${VideoQualityMode[newChannel.videoQualityMode || 1]}`, inline: true },
          emptyField
        );
    }

    const embedData = embed.toJSON();
    if (!embedData.fields?.length || embedData.fields.length > 25 || embedData.fields.length <= 1) return;

    await logChannel.send({
      embeds: [embed],
    });
  },
});
