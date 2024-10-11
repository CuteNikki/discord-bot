import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { getUser } from 'db/user';

import { sendError } from 'utils/error';
import { supportedLanguages } from 'utils/language';
import { logger } from 'utils/logger';

export default new Event({
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction) {
    if (!interaction.isAutocomplete()) {
      return;
    }

    const command = client.commands.get(interaction.commandName);

    if (!command || !command.options.autocomplete) {
      return;
    }

    const { banned, language } = (await getUser(interaction.user.id)) ?? { banned: false, language: supportedLanguages[0] };

    if (banned) {
      return;
    }

    let lng = language;
    if (!lng) lng = supportedLanguages[0];

    try {
      await command.options.autocomplete({ interaction, client, lng });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      await interaction.respond([]).catch((err) => logger.debug({ err }, 'Could not respond to autocomplete'));

      await sendError({
        client,
        err,
        location: `Autocomplete Interaction Error: ${command.options.data.name}`
      });
    }
  }
});
