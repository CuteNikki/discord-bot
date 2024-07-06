import { Events } from 'discord.js';

import { Event } from 'classes/event';
import { logger } from 'utils/logger';

export default new Event({
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction) {
    if (!interaction.isAutocomplete() || !client.usable) return;

    const command = client.commands.get(interaction.commandName);
    if (!command || !command.options.autocomplete) return;

    const user = await client.getUserSettings(interaction.user.id);
    if (user.banned) return;

    try {
      await command.options.autocomplete({ interaction, client });
    } catch (err) {
      logger.error(err, `Could not autocomplete ${command.options.data.name}`);
    }
  },
});
