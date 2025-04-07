import { REST, Routes } from 'discord.js';

import { performance } from 'perf_hooks';

import type { Command } from 'classes/command';

import { getCommandFiles } from 'utility/commands';
import logger from 'utility/logger';

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_BOT_ID;
const guildId = process.env.DISCORD_DEV_GUILD_ID;

if (!token) {
  logger.error('No DISCORD_BOT_TOKEN provided');
  process.exit(1);
}

if (!clientId) {
  logger.error('No DISCORD_BOT_ID provided');
  process.exit(1);
}

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

const rest = new REST().setToken(token);

(async () => {
  try {
    logger.info(`Started reloading ${commands.length} application (/) command${commands.length > 1 || commands.length === 0 ? 's' : ''}.`);

    const deployStartTime = performance.now();

    const data = (await rest.put(Routes.applicationCommands(clientId), { body: commands })) as unknown as { id: string; name: string }[];
    if (guildId) await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

    const deployEndTime = performance.now();

    logger.info(
      `Successfully reloaded ${data.length} application (/) command${commands.length > 1 || commands.length === 0 ? 's' : ''} in ${Math.floor(deployEndTime - deployStartTime)}ms`,
    );
  } catch (error) {
    logger.error({ err: error }, 'Failed to refresh application (/) commands');
  }
})();
