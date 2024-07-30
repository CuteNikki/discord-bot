import { Events } from 'discord.js';

import { Event } from 'classes/event';
import { sendError } from 'utils/error';

export default new Event({
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction) {
    if (!interaction.isAutocomplete()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command || !command.options.autocomplete) return;

    try {
      await command.options.autocomplete({ interaction, client });
    } catch (err: any) {
      await interaction.respond([]);

      await sendError({
        client,
        err,
        location: 'Autocomplete Interaction Error',
      });
    }
  },
});
