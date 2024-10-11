import { Collection, EmbedBuilder, Events, inlineCode, time, TimestampStyles, type InteractionReplyOptions } from 'discord.js';
import { t } from 'i18next';

import { ModuleType } from 'classes/command';
import { Event } from 'classes/event';

import { incrementCommandsExecuted, incrementCommandsFailed } from 'db/client';
import { getGuild } from 'db/guild';
import { getUser } from 'db/user';

import { keys } from 'constants/keys';

import { sendError } from 'utils/error';
import { supportedLanguages } from 'utils/language';

// Collection of cooldowns so interactions cannot be spammed
// !! This should not be used for hourly or daily commands as it resets with each restart !!
const cooldowns = new Collection<string, Collection<string, number>>(); // Collection<customId/commandName, Collection<userId, lastUsedTimestamp>>

export default new Event({
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    // We only want to run this event for commands
    if (!interaction.isCommand()) return;

    const { banned, language } = (await getUser(interaction.user.id)) ?? { banned: false, language: supportedLanguages[0] };

    // If the user is banned, we don't want to continue
    if (banned) {
      return;
    }

    // getting the users language
    let lng = language;
    if (!lng) lng = supportedLanguages[0];

    // getting the command
    const command = client.commands.get(interaction.commandName);

    // if the command wasn't found, we don't want to continue
    if (!command) {
      return;
    }

    /**
     * Module check
     */
    if (interaction.guild) {
      const guildSettings = await getGuild(interaction.guild.id);

      const message: InteractionReplyOptions = {
        embeds: [
          new EmbedBuilder().setColor(client.colors.error).setDescription(t('interactions.module', { lng, module: ModuleType[command.options.module] }))
        ],
        ephemeral: true
      };

      switch (command.options.module) {
        case ModuleType.Moderation:
          if (!guildSettings.moderation?.enabled) {
            await interaction.reply(message);
            return;
          }
          break;
        case ModuleType.Level:
          if (!guildSettings.level.enabled) {
            await interaction.reply(message);
            return;
          }
          break;
      }
    }

    /**
     * Bot permissions check
     */
    if (command.options.botPermissions?.length && interaction.guild?.members.me) {
      const permissions = interaction.guild.members.me.permissions;

      if (!permissions.has(command.options.botPermissions)) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.error)
              .setDescription(t('interactions.bot-permissions', { lng, permissions: command.options.botPermissions.join(', ') }))
          ],
          ephemeral: true
        });
        return;
      }
    }

    /**
     * isDeveloperOnly check
     */
    if (command.options.isDeveloperOnly && !keys.DEVELOPER_USER_IDS.includes(interaction.user.id)) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('interactions.developer-only', { lng }))],
        ephemeral: true
      });
      return;
    }

    /**
     * Handling cooldowns
     */
    if (!cooldowns.has(command.options.data.name)) {
      cooldowns.set(command.options.data.name, new Collection());
    }

    const now = Date.now();
    // collection of <user id, last used timestamp>
    const timestamps = cooldowns.get(command.options.data.name)!;
    // the buttons cooldown or 3 seconds
    const cooldownAmount = command.options.cooldown ?? 3_000;

    // if the user is still on cooldown
    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);

        await interaction.reply({
          embeds: [
            new EmbedBuilder().setColor(client.colors.error).setDescription(
              t('interactions.cooldown', {
                lng,
                action: inlineCode(command.options.data.name),
                timestamp: time(expiredTimestamp, TimestampStyles.RelativeTime)
              })
            )
          ],
          ephemeral: true
        });
        return;
      }
    }
    // Add the user to cooldowns
    timestamps.set(interaction.user.id, now);
    // Remove the user from cooldowns after the cooldown is over
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    /**
     * Running the command
     */
    try {
      await command.options.execute({ client, interaction, lng });
      await incrementCommandsExecuted(keys.DISCORD_BOT_ID);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const embed = new EmbedBuilder().setColor(client.colors.error).setDescription(t('interactions.error', { lng, error: err.message }));

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await sendError({ client, err, location: `Command Interaction Error: ${command.options.data.name}` });
      await incrementCommandsFailed(keys.DISCORD_BOT_ID);
    }
  }
});
