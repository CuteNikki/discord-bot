import type { ExtendedClient } from 'classes/client';
import type { ClientEventTypes } from 'discord.js';

export class Event<T extends keyof ClientEventTypes> {
  constructor(
    public options: {
      name: T;
      once?: boolean;
      execute: (client: ExtendedClient, ...args: ClientEventTypes[T]) => unknown;
    },
  ) {}
}
