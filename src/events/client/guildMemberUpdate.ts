import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { getClientSettings } from 'db/client';
import { getUserData, updateUserData } from 'db/user';
import { BadgeType } from 'models/user';

import { keys } from 'constants/keys';
import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(client, oldMember, newMember) {
    if (!client.isReady()) return;
    if ((newMember.premiumSinceTimestamp ?? false) === (oldMember.premiumSinceTimestamp ?? false)) return;

    const settings = await getClientSettings(keys.DISCORD_BOT_ID);
    if (settings.support.guildId !== newMember.guild.id) return;

    const userData = await getUserData(newMember.user.id);
    if (userData.badges.map((badge) => badge.id).includes(BadgeType.Supporter)) return;

    await newMember
      .send('Thank you for boosting the support server. You received the Supporter badge!')
      .catch((err) => logger.debug({ err, userId: newMember.user.id }, 'Could not send DM'));
    await updateUserData(newMember.user.id, {
      $push: { badges: { id: BadgeType.Supporter, receivedAt: Date.now() } },
    });
  },
});
