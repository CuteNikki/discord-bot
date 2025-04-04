import { Events } from 'discord.js';

import { Event } from 'classes/event';

import logger from 'utility/logger';

export default new Event({
  name: Events.ClientReady,
  once: true,
  async execute(extendedClient, readyClient) {
    // Fetching and setting custom emojis
    await readyClient.application.emojis.fetch();

    for (const emoji of readyClient.application.emojis.cache.values()) {
      extendedClient.customEmojis[emoji.name as keyof typeof extendedClient.customEmojis] = emoji;
    }

    logger.info(`Logged in as ${readyClient.user.tag}`);
  },
});
