import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { keys } from 'constants/keys';

import { incrementGuildsJoined } from 'db/client';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildCreate,
  once: false,
  async execute(_client, guild) {
    await incrementGuildsJoined(keys.DISCORD_BOT_ID);

    logger.debug(guild, 'Joined a Guild');
  }
});
