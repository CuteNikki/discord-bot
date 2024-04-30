import { Events } from 'discord.js';

import { Event } from 'classes/event';
import { logger } from '../../utilities/logger';

export default new Event({
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction) {
    if (!interaction.isAutocomplete()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command || !command.options.autocomplete) return;

    try {
      await command.options.autocomplete({ interaction, client });
    } catch (err) {
      logger.error(`Could not autocomplete ${command.options.data.name}`, err);
    }
  },
});
