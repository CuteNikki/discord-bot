import type { ModalSubmitInteraction, PermissionsString } from 'discord.js';

import type { DiscordClient } from 'classes/client';

export class Modal {
  constructor(
    public options: {
      customId: string;
      cooldown?: number;
      isDeveloperOnly?: boolean; // If true, can only be used by developers
      isCustomIdIncluded?: boolean; // If true, customId does not need to be an exact match
      permissions?: PermissionsString[]; // Array of permissions required to use the modal
      execute({ interaction, client }: { client: DiscordClient; interaction: ModalSubmitInteraction }): any;
    }
  ) {}
}
