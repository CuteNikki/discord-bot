// random test file to mess around with the database

import { getInfractionsByGuildId, getInfractionsByModeratorIdAndGuildId, getInfractionsByUserId } from 'database/infraction';

import logger from 'utility/logger';

const userId = '303142922780672013';
const guildId = '741742952979890276';
const moderatorId = '787729763035906099';

logger.info({ data: { userId, guildId, moderatorId } }, 'Infraction test');

// const warnInfraction = await createInfraction({
//   userId,
//   guildId,
//   moderatorId,
//   type: InfractionType.Warn,
//   reason: 'Being a bad user',
// });
// const tempbanInfraction = await createInfraction({
//   userId,
//   guildId,
//   moderatorId,
//   type: InfractionType.Tempban,
//   reason: 'Being a bad user',
//   expiresAt: new Date(Date.now() + 60_000), // 60 seconds from now
//   isActive: true,
// });

// logger.info({ data: [warnInfraction, tempbanInfraction] }, 'Created infractions');

const infractionsByModerator = await getInfractionsByModeratorIdAndGuildId(moderatorId, guildId);
logger.info({ data: infractionsByModerator }, 'Infractions by Moderator on Guild');

const infractionsByUser = await getInfractionsByUserId(userId);
logger.info({ data: infractionsByUser }, 'Infractions by User');

const infractionsByGuild = await getInfractionsByGuildId(guildId);
logger.info({ data: infractionsByGuild }, 'Infractions in Guild');
