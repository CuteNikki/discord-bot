// random test file to mess around with the database

import type { Guild } from '@prisma/client';

import { createGuild, getGuild } from 'database/guild';

import logger from 'utility/logger';

const guildId = '741742952979890276';

let guild: Guild | null = await getGuild(guildId);

if (!guild) {
  guild = await createGuild(guildId);
}

logger.info({ data: guild }, 'Guild Data');
