import { Events, type Interaction } from 'discord.js';

import { Event } from 'classes/event';

import { getBlacklist } from 'database/blacklist';

import logger from 'utility/logger';

export default new Event({
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction: Interaction) {
    logger.debug({ data: interaction }, 'Interaction received');

    if (!interaction.isAutocomplete()) {
      logger.debug('Interaction is not an autocomplete');
      return;
    }

    const command = client.commands.get(interaction.commandName);
    if (!command || !command.options.autocomplete) {
      logger.debug({ data: interaction.commandName }, 'Command not found');
      return;
    }

    const blacklist = await getBlacklist(interaction.user.id);
    if (blacklist) {
      logger.debug({ data: blacklist }, 'User is blacklisted');
      return;
    }

    try {
      logger.debug({ data: command }, 'Executing autocomplete command');
      await command.options.autocomplete(interaction);
    } catch (error) {
      logger.error(error);
    }
  },
});
