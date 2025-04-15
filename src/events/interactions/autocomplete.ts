import { Events, type Interaction } from 'discord.js';

import { Event } from 'classes/event';

import { getBlacklist } from 'database/blacklist';

import logger from 'utility/logger';

export default new Event({
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction: Interaction) {
    if (!interaction.isAutocomplete()) {
      return;
    }

    /**
     * Finding the command
     */

    const command = client.commands.get(interaction.commandName);
    if (!command || !command.options.autocomplete) {
      return;
    }

    /**
     * Handling blacklisted users
     */

    const blacklist = await getBlacklist(interaction.user.id);
    if (blacklist) {
      return;
    }

    /**
     * Executing the command autocomplete
     */

    try {
      await command.options.autocomplete(interaction);
    } catch (error) {
      logger.error(error);
    }
  },
});
