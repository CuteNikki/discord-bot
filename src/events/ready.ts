import { Client, Events } from 'discord.js';

import logger from 'utility/logger';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client<true>) {
    logger.info(`Logged in as ${client.user.tag}`);
  },
};
