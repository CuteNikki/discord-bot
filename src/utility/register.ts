import { REST, Routes } from 'discord.js';

import { performance } from 'perf_hooks';

import type { Command } from 'classes/command';

import { getCommandFiles } from 'utility/files';
import { KEYS } from 'utility/keys';
import logger from 'utility/logger';

logger.info('Loading command files');
const startTime = performance.now();

const commands = [];
const { cmdFiles } = getCommandFiles();

for (const filePath of cmdFiles) {
  const command = (await import(filePath)).default as Command;

  if ('builder' in command.options && 'execute' in command.options) {
    commands.push(command.options.builder.toJSON());
    logger.info(`Loaded command file ${filePath}`);
  } else {
    logger.warn(`Command file ${filePath} is missing data or execute`);
  }
}

const endTime = performance.now();
logger.info(
  `Loaded ${cmdFiles.length} command${cmdFiles.length > 1 || cmdFiles.length === 0 ? 's' : ''} in ${Math.floor(endTime - startTime)}ms`,
);

const rest = new REST().setToken(KEYS.DISCORD_BOT_TOKEN);

(async () => {
  try {
    logger.info(`Started reloading ${commands.length} application (/) command${commands.length > 1 || commands.length === 0 ? 's' : ''}.`);

    const deployStartTime = performance.now();

    const data = (await rest.put(Routes.applicationCommands(KEYS.DISCORD_BOT_ID), { body: commands })) as unknown as {
      id: string;
      name: string;
    }[];
    if (KEYS.DISCORD_DEV_GUILD_ID)
      await rest.put(Routes.applicationGuildCommands(KEYS.DISCORD_BOT_ID, KEYS.DISCORD_DEV_GUILD_ID), { body: commands });

    const deployEndTime = performance.now();

    logger.info(
      `Successfully reloaded ${data.length} application (/) command${commands.length > 1 || commands.length === 0 ? 's' : ''} in ${Math.floor(deployEndTime - deployStartTime)}ms`,
    );
  } catch (error) {
    logger.error({ err: error }, 'Failed to refresh application (/) commands');
  }
})();
