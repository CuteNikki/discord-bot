import { ButtonInteraction, type PermissionsString } from 'discord.js';
import type { DiscordClient } from './client';

export class Button {
  constructor(
    public options: {
      developerOnly?: boolean; // If command is for developer only, it cannot be used by anyone else
      authorOnly?: boolean;
      cooldown?: number; // Cooldown between command executes per user (in milliseconds)
      includesCustomId?: boolean;
      permissions?: PermissionsString[];
      customId: string;
      execute: (options: { client: DiscordClient; interaction: ButtonInteraction }) => any;
    }
  ) {}
}
