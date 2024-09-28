import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { getClientSettings } from 'db/client';
import { addBadge, getUserData } from 'db/user';

import { BadgeType } from 'types/user';

import { keys } from 'constants/keys';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(_client, oldMember, newMember) {
    if ((newMember.premiumSinceTimestamp ?? false) === (oldMember.premiumSinceTimestamp ?? false)) return;

    const settings = await getClientSettings(keys.DISCORD_BOT_ID);
    if (settings.support.guildId !== newMember.guild.id) return;

    const userData = await getUserData(newMember.user.id);
    if (userData.badges.map((badge) => badge.id).includes(BadgeType.Supporter)) return;

    await newMember
      .send('Thank you for boosting the support server. You received the Supporter badge!')
      .catch((err) => logger.debug({ err, userId: newMember.user.id }, 'Could not send DM'));
    await addBadge(newMember.user.id, BadgeType.Supporter);
  },
});
