import type { ClientEvents } from 'discord.js';
import type { DiscordClient } from './client';

export class Event<Name extends keyof ClientEvents> {
  constructor(public options: { name: Name; once?: boolean; execute: (client: DiscordClient, ...args: ClientEvents[Name]) => any }) {}
}
