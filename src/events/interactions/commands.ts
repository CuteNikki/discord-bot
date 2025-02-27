import { Events, MessageFlags, type Interaction } from 'discord.js';

import type { ExtendedClient } from 'classes/client';

import { getBlacklist } from 'database/blacklist';

import logger from 'utility/logger';

export default {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction: Interaction) {
    logger.debug({ data: interaction }, 'Interaction received');
    if (!interaction.isCommand()) {
      logger.debug('Interaction is not a command');
      return;
    }

    const { commandName } = interaction;
    const client = interaction.client as ExtendedClient;

    const command = client.commands.get(commandName);
    if (!command) {
      logger.debug({ data: commandName }, 'Command not found');
      return;
    }

    const blacklist = await getBlacklist(interaction.user.id);
    if (blacklist) {
      logger.debug({ data: blacklist }, 'User is blacklisted');
      await interaction
        .reply({
          content: blacklist.expiresAt
            ? `You are blacklisted from using this bot until <t:${Math.floor(blacklist.expiresAt.getTime() / 1000)}>!`
            : 'You are blacklisted from using this bot!',
          flags: [MessageFlags.Ephemeral],
        })
        .catch((e) => logger.debug({ err: e }, 'Error while replying to interaction'));
      return;
    }

    try {
      logger.debug({ data: command }, 'Executing command');
      await command.execute(interaction);
    } catch (error) {
      logger.error(error);

      if (interaction.replied) {
        await interaction
          .followUp({ content: 'There was an error while executing this command!', flags: [MessageFlags.Ephemeral] })
          .catch((e) => logger.debug({ err: e }, 'Error while following up to interaction'));
      } else {
        await interaction
          .reply({ content: 'There was an error while executing this command!', flags: [MessageFlags.Ephemeral] })
          .catch((e) => logger.debug({ err: e }, 'Error while replying to interaction'));
      }
    }
  },
};
