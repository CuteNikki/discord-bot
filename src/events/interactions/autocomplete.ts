import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { getUserData } from 'db/user';

import { sendError } from 'utils/error';
import { supportedLanguages } from 'utils/language';

export default new Event({
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction) {
    if (!interaction.isAutocomplete()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command || !command.options.autocomplete) return;

    const { banned, language } = await getUserData(interaction.user.id);
    if (banned) return;

    let lng = language;
    if (!lng) lng = supportedLanguages[0];

    try {
      await command.options.autocomplete({ interaction, client, lng });
    } catch (err: any) {
      await interaction.respond([]);

      await sendError({
        client,
        err,
        location: `Autocomplete Interaction Error: ${command.options.data.name}`,
      });
    }
  },
});
