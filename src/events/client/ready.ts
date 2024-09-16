import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.ClientReady,
  once: true,
  async execute(client, readyClient) {
    await readyClient.application.emojis.fetch();

    for (const emoji of readyClient.application.emojis.cache.values()) {
      client.customEmojis[emoji.name as keyof typeof client.customEmojis] = emoji.toString();
    }

    logger.info(`[${client.cluster.id}] Ready as ${readyClient.user.username}#${readyClient.user.discriminator}`);
  },
});
