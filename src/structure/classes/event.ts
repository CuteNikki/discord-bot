import type { ClientEvents } from 'discord.js';

import type { DiscordClient } from 'classes/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Event<Name extends keyof ClientEvents = any> {
  constructor(
    public options: {
      name: Name;
      once?: boolean;
      execute(client: DiscordClient, ...args: ClientEvents[Name]): unknown;
    }
  ) {}
}
