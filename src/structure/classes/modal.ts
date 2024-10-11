import type { ModalSubmitInteraction, PermissionsString } from 'discord.js';

import type { DiscordClient } from 'classes/client';

import type { ModuleType } from 'types/interactions';

export class Modal {
  constructor(
    public options: {
      module: ModuleType;
      customId: string;
      cooldown?: number;
      isDeveloperOnly?: boolean; // If true, can only be used by developers
      isCustomIdIncluded?: boolean; // If true, customId does not need to be an exact match
      permissions?: PermissionsString[]; // Array of permissions required to use the modal
      botPermissions?: PermissionsString[]; // Array of permissions the bot requires
      execute({ interaction, client, lng }: { client: DiscordClient; interaction: ModalSubmitInteraction; lng: string }): unknown;
    }
  ) {}
}
