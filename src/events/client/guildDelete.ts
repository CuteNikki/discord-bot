import { Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildDelete,
  once: false,
  async execute(client, guild) {
    await client.updateClientSettings(guild.id, {
      $inc: { ['stats.guildsLeft']: 1 },
    });
  },
});
