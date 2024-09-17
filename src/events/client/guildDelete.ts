import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { updateClientSettings } from 'db/client';

export default new Event({
  name: Events.GuildDelete,
  once: false,
  async execute(_client, guild) {
    await updateClientSettings(guild.id, {
      $inc: { ['stats.guildsLeft']: 1 },
    });
  },
});
