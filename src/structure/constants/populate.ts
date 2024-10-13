import type { PopulateOptions } from 'mongoose';

export const DEFAULT_GUILD_POPULATE: PopulateOptions[] = [
  { path: 'starboard' },
  { path: 'customVoice' },
  { path: 'reactionRoles', populate: { path: 'groups' } },
  { path: 'counting' },
  { path: 'ticket' },
  { path: 'moderation' },
  { path: 'level' },
  { path: 'welcome' },
  { path: 'farewell' },
  { path: 'log' }
];

export const DEFAULT_REACTION_ROLE_POPULATE: PopulateOptions[] = [{ path: 'groups' }];
