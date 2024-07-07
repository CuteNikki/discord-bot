import { Collection, REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';

import type { Command } from 'classes/command';
import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

const commands = new Collection<string, Command>();

const foldersPath = path.join(process.cwd(), 'src/commands');
const folders = fs.readdirSync(foldersPath).filter((value) => !value.endsWith('.txt'));

for (const folder of folders) {
  const commandsPath = path.join(foldersPath, folder);
  const files = fs.readdirSync(commandsPath).filter((value) => value.endsWith('.ts') || value.endsWith('.js'));

  for (const file of files) {
    const filePath = path.join(commandsPath, file);
    const command = await import('file://' + filePath);

    if (!command.default) {
      logger.error(filePath, 'Failed to load command');
      continue;
    }

    commands.set(command.default.options.data.name, command.default);
  }
}
logger.info(`Loaded ${commands.size} commands`);

const { DISCORD_BOT_ID, DISCORD_BOT_TOKEN } = keys;
const rest = new REST().setToken(DISCORD_BOT_TOKEN);

const commandsArray = commands.filter((cmd) => !cmd.options.developerOnly).map((cmd) => cmd.options.data);
const devCommandsArray = commands.filter((cmd) => cmd.options.developerOnly).map((cmd) => cmd.options.data);

try {
  await rest.put(Routes.applicationCommands(DISCORD_BOT_ID), { body: commandsArray });
  logger.info('Registered commands');
} catch (err) {
  logger.error(err, 'Failed to register commands');
}

for (const guildId of keys.DEVELOPER_GUILD_IDS) {
  try {
    await rest.put(Routes.applicationGuildCommands(DISCORD_BOT_ID, guildId), { body: devCommandsArray });
    logger.info(`Registered guild commands for ${guildId}`);
  } catch (err) {
    logger.error(err, `Failed to register guild commands for ${guildId}`);
  }
}
