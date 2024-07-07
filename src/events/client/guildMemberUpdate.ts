import { Events } from 'discord.js';

import { Event } from 'classes/event';
import { BadgeType } from 'models/user';

export default new Event({
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(client, oldMember, newMember) {
    if (!client.isReady()) return;
    if ((newMember.premiumSinceTimestamp ?? false) === (oldMember.premiumSinceTimestamp ?? false)) return;

    const settings = await client.getClientSettings(client.application.id);
    if (settings.support.guildId !== newMember.guild.id) return;

    const userData = await client.getUserData(newMember.user.id);
    if (userData.badges.map((badge) => badge.id).includes(BadgeType.SUPPORTER)) return;

    await newMember.send('Thank you for boosting the support server. You received the Supporter badge!').catch(() => {});
    await client.updateUserData(newMember.user.id, { $push: { badges: { id: BadgeType.SUPPORTER, receivedAt: Date.now() } } });
  },
});
