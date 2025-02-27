import { REST, Routes } from 'discord.js';
import path from 'node:path';

import { performance } from 'perf_hooks';

import { getCommandFiles } from 'start/commands';

import logger from 'utility/logger';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_ID;
const guildId = process.env.DISCORD_DEV_GUILD_ID;

if (!token) {
  logger.error('No DISCORD_TOKEN provided');
  process.exit(1);
}

if (!clientId) {
  logger.error('No DISCORD_ID provided');
  process.exit(1);
}

logger.info('Loading command files');
const startTime = performance.now();

const commands = [];
const { cmdPath, cmdFiles } = getCommandFiles();

for (const file of cmdFiles) {
  const filePath = path.join(cmdPath, file);
  const command = await import(filePath);

  if ('data' in command.default && 'execute' in command.default) {
    commands.push(command.default.data.toJSON());
    logger.info(`Loaded command file ${file}`);
  } else {
    logger.warn(`Command file ${file} is missing data or execute`);
  }
}

const endTime = performance.now();
logger.info(`Loaded ${cmdFiles.length} command${cmdFiles.length > 1 || cmdFiles.length === 0 ? 's' : ''} in ${Math.floor(endTime - startTime)}ms`);

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
