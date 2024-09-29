import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { keys } from 'constants/keys';

import { incrementGuildsLeft } from 'db/client';

export default new Event({
  name: Events.GuildDelete,
  once: false,
  async execute() {
    await incrementGuildsLeft(keys.DISCORD_BOT_ID);
  }
});
