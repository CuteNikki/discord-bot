import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildSettings } from 'db/guild';

export default new Event({
  name: Events.ThreadUpdate,
  once: false,
  async execute(_client, oldThread, newThread) {
    const guild = newThread.guild;

    const config = await getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.threadUpdate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = config.language;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.threadUpdate.title', { lng }))
      .addFields({
        name: t('log.threadUpdate.thread', { lng }),
        value: `${newThread.toString()} (\`${newThread.name}\` | ${newThread.id})`,
      })
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newThread.name !== oldThread.name)
      embed.addFields(
        {
          name: t('log.threadUpdate.old_name', { lng }),
          value: oldThread.name,
          inline: true,
        },
        {
          name: t('log.threadUpdate.new_name', { lng }),
          value: newThread.name,
          inline: true,
        },
        emptyField,
      );
    if (newThread.locked !== oldThread.locked)
      embed.addFields(
        {
          name: t('log.threadUpdate.old_locked', { lng }),
          value: `${oldThread.locked}`,
          inline: true,
        },
        {
          name: t('log.threadUpdate.new_locked', { lng }),
          value: `${newThread.locked}`,
          inline: true,
        },
        emptyField,
      );
    if (newThread.archived !== oldThread.archived)
      embed.addFields(
        {
          name: t('log.threadUpdate.old_archived', { lng }),
          value: `${oldThread.archived}`,
          inline: true,
        },
        {
          name: t('log.threadUpdate.new_archived', { lng }),
          value: `${newThread.archived}`,
          inline: true,
        },
        emptyField,
      );
    if (newThread.archiveTimestamp !== oldThread.archiveTimestamp)
      embed.addFields(
        {
          name: t('log.threadUpdate.old_archived_at', { lng }),
          value: oldThread.archiveTimestamp ? `<t:${Math.floor(oldThread.archiveTimestamp / 1000)}:f>` : '/',
          inline: true,
        },
        {
          name: t('log.threadUpdate.new_archived_at', { lng }),
          value: newThread.archiveTimestamp ? `<t:${Math.floor(newThread.archiveTimestamp / 1000)}:f>` : '/',
          inline: true,
        },
        emptyField,
      );
    if (JSON.stringify(newThread.appliedTags) !== JSON.stringify(oldThread.appliedTags))
      embed.addFields(
        {
          name: t('log.threadUpdate.old_applied_tags', { lng }),
          value: oldThread.appliedTags.join('\n').slice(0, 1000) ?? '/',
          inline: true,
        },
        {
          name: t('log.threadUpdate.new_applied_tags', { lng }),
          value: newThread.appliedTags.join('\n').slice(0, 1000) ?? '/',
          inline: true,
        },
        emptyField,
      );
    if (JSON.stringify(newThread.members.cache.toJSON()) !== JSON.stringify(oldThread.members.cache.toJSON())) {
      const addedMembers = newThread.members.cache.map((m) => m).filter((member) => !oldThread.members.cache.map((mem) => mem.id).includes(member.id));
      const removedMembers = oldThread.members.cache.map((m) => m).filter((member) => !newThread.members.cache.map((mem) => mem.id).includes(member.id));
      embed.addFields(
        {
          name: t('log.threadUpdate.added_members', { lng }),
          value:
            addedMembers
              .map((member) => `<@${member.id}> (\`${member.user?.username}\` | ${member.user?.id})`)
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true,
        },
        {
          name: t('log.threadUpdate.removed_members', { lng }),
          value:
            removedMembers
              .map((member) => `<@${member.id}> (\`${member.user?.username}\` | ${member.user?.id})`)
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true,
        },
        emptyField,
      );
    }

    const embedData = embed.toJSON();
    if (!embedData.fields?.length || embedData.fields.length > 25) return;

    await logChannel.send({ embeds: [embed] });
  },
});
