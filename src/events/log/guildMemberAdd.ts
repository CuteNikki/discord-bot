import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildMemberAdd,
  once: false,
  async execute(client, member) {
    const { guild, user, partial } = member;
    if (partial) await member.fetch().catch((error) => logger.debug({ error }, 'Could not fetch member'));

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.guildMemberAdd || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle('Guild Member Add')
      .addFields(
        { name: 'Member', value: `${user.toString()} (\`${user.username}\` | ${user.id})` },
        { name: 'Created at', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:f> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)` }
      );

    if (Date.now() - user.createdTimestamp < 7 * 24 * 60 * 60 * 1000) {
      embed.addFields({ name: 'Potentially Dangerous', value: 'Account was created less than 7 days ago!' });
      components.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(`button-ban_${user.id}`).setStyle(ButtonStyle.Danger).setLabel('Ban Member'),
          new ButtonBuilder().setCustomId(`button-kick_${user.id}`).setStyle(ButtonStyle.Danger).setLabel('Kick Member')
        )
      );
    }

    await logChannel.send({
      embeds: [embed],
      components,
    });
  },
});
