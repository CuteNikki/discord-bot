import { Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildCreate,
  once: false,
  async execute(client, guild) {
    await client.updateClientSettings(guild.id, {
      $inc: { ['stats.guildsJoined']: 1 },
    });
  },
});
