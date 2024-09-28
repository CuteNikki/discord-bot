import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { keys } from 'constants/keys';

import { incrementGuildsJoined } from 'db/client';

export default new Event({
  name: Events.GuildCreate,
  once: false,
  async execute(_client, _guild) {
    await incrementGuildsJoined(keys.DISCORD_BOT_ID);
  },
});
