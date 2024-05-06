import type { ModalSubmitInteraction, PermissionsString } from 'discord.js';

import type { DiscordClient } from 'classes/client';

export class Modal {
  constructor(
    public options: {
      customId: string;
      developerOnly?: boolean;
      includesCustomId?: boolean;
      cooldown?: number;
      permissions?: PermissionsString[];
      execute: (options: { interaction: ModalSubmitInteraction; client: DiscordClient }) => any;
    }
  ) {}
}
