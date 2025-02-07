import {
  Collection,
  EmbedBuilder,
  Events,
  inlineCode,
  MessageFlags,
  PermissionsBitField,
  time,
  TimestampStyles,
  type InteractionReplyOptions
} from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuild } from 'db/guild';
import { getUser } from 'db/user';

import { sendError } from 'utils/error';
import { supportedLanguages } from 'utils/language';

import { keys } from 'constants/keys';

import { ModuleType } from 'types/interactions';

// Collection of cooldowns so interactions cannot be spammed
// !! This should not be used for hourly or daily commands as it resets with each restart !!
const cooldowns = new Collection<string, Collection<string, number>>(); // Collection<customId/commandName, Collection<userId, lastUsedTimestamp>>

export default new Event({
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    // We only want to run this event for modals
    if (!interaction.isModalSubmit()) return;

    const { banned, language } = (await getUser(interaction.user.id)) ?? { banned: false, language: supportedLanguages[0] };

    // If the user is banned, we don't want to continue
    if (banned) {
      return;
    }

    // getting the users language
    let lng = language;
    if (!lng) lng = supportedLanguages[0];

    let modal = client.modals.get(interaction.customId);

    /**
     * isCustomIdIncluded check
     */
    if (!modal) {
      for (const [, mdl] of client.modals) {
        if (!interaction.customId.includes(mdl.options.customId) || !mdl.options.isCustomIdIncluded) {
          continue;
        }

        modal = mdl;
        break;
      }
    }
    // If we don't have a modal, we don't want to continue
    if (!modal) {
      return;
    }

    /**
     * Module check
     */
    if (interaction.guild) {
      const guildSettings = (await getGuild(interaction.guild.id)) ?? {
        moderation: { enabled: false },
        level: { enabled: false },
        welcome: { enabled: false },
        farewell: { enabled: false },
        ticket: { enabled: false },
        economy: { enabled: false }
      };

      const message: InteractionReplyOptions = {
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('interactions.module', { lng, module: ModuleType[modal.options.module] }))],
        flags: [MessageFlags.Ephemeral]
      };

      switch (modal.options.module) {
        case ModuleType.Moderation:
          if (!guildSettings.moderation?.enabled) {
            await interaction.reply(message);
            return;
          }
          break;
        case ModuleType.Level:
          if (!guildSettings.level?.enabled) {
            await interaction.reply(message);
            return;
          }
          break;
        case ModuleType.Welcome:
          if (!guildSettings.welcome?.enabled) {
            await interaction.reply(message);
            return;
          }
          break;
        case ModuleType.Farewell:
          if (!guildSettings.farewell?.enabled) {
            await interaction.reply(message);
            return;
          }
          break;
        case ModuleType.Ticket:
          if (!guildSettings.ticket?.enabled) {
            await interaction.reply(message);
            return;
          }
          break;
        case ModuleType.Economy:
          if (!guildSettings.economy?.enabled) {
            await interaction.reply(message);
            return;
          }
          break;
      }
    }

    /**
     * Member permissions check
     */
    if (modal.options.permissions?.length && interaction.member) {
      const permissions = interaction.member.permissions as PermissionsBitField;

      if (!permissions.has(modal.options.permissions)) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.error)
              .setDescription(t('interactions.permissions', { lng, permissions: modal.options.permissions.join(', ') }))
          ],
          flags: [MessageFlags.Ephemeral]
        });
        return;
      }
    }

    /**
     * Bot permissions check
     */
    if (modal.options.botPermissions?.length && interaction.guild?.members.me) {
      const permissions = interaction.guild.members.me.permissions;

      if (!permissions.has(modal.options.botPermissions)) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.error)
              .setDescription(t('interactions.bot-permissions', { lng, permissions: modal.options.botPermissions.join(', ') }))
          ],
          flags: [MessageFlags.Ephemeral]
        });
        return;
      }
    }

    /**
     * isDeveloperOnly check
     */
    if (modal.options.isDeveloperOnly && !keys.DEVELOPER_USER_IDS.includes(interaction.user.id))
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('interactions.developer-only', { lng }))],
        flags: [MessageFlags.Ephemeral]
      });

    /**
     * Handling cooldowns
     */
    if (!cooldowns.has(modal.options.customId)) {
      cooldowns.set(modal.options.customId, new Collection());
    }

    const now = Date.now();
    // collection of <user id, last used timestamp>
    const timestamps = cooldowns.get(modal.options.customId)!;
    // the buttons cooldown or 3 seconds
    const cooldownAmount = modal.options.cooldown ?? 3_000;

    // if the user is still on cooldown
    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.error)
              .setDescription(
                t('interactions.cooldown', { lng, action: inlineCode(modal.options.customId), timestamp: time(expiredTimestamp, TimestampStyles.RelativeTime) })
              )
          ],
          flags: [MessageFlags.Ephemeral]
        });
        return;
      }
    }
    // Add the user to cooldowns
    timestamps.set(interaction.user.id, now);
    // Remove the user from cooldowns after the cooldown is over
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    /**
     * Running the modal
     */
    try {
      await modal.options.execute({ client, interaction, lng });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const embed = new EmbedBuilder().setColor(client.colors.error).setDescription(t('interactions.error', { lng, error: err.message }));

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
      }

      await sendError({ client, err, location: `Modal Interaction Error: ${modal.options.customId}` });
    }
  }
});
