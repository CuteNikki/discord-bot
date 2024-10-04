import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { keys } from 'constants/keys';

import { incrementGuildsLeft } from 'db/client';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildDelete,
  once: false,
  async execute(_client, guild) {
    await incrementGuildsLeft(keys.DISCORD_BOT_ID);

    logger.debug(guild, 'Left a Guild');
  }
});
