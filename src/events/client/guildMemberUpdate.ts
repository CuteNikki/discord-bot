import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { getClientSettings } from 'db/client';
import { addBadge, getUser } from 'db/user';

import { BadgeType } from 'types/user';

import { keys } from 'constants/keys';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(_client, oldMember, newMember) {
    // If the new member did not boost or if the old member was a booster, ignore
    if (!newMember.premiumSinceTimestamp || oldMember.premiumSinceTimestamp) {
      return;
    }

    const settings = (await getClientSettings(keys.DISCORD_BOT_ID)) ?? { support: { guildId: null } };

    // If the member was not updated in the support server, ignore
    if (settings.support.guildId !== newMember.guild.id) {
      return;
    }

    const userData = (await getUser(newMember.user.id)) ?? { badges: [] };

    // If the member already has the Supporter badge, ignore
    if (userData.badges.map((badge) => badge.id).includes(BadgeType.Supporter)) {
      return;
    }

    // Send a thank you message to the member
    await newMember
      .send(`Thank you for boosting the support server. You received the **${BadgeType[BadgeType.Supporter]}** badge!`)
      .catch((err) => logger.debug({ err, user: newMember.user }, 'Could not send DM'));
    // Add the badge to the member
    await addBadge(newMember.user.id, BadgeType.Supporter);
  }
});
