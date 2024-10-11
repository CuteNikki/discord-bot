import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  inlineCode,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  time,
  TimestampStyles
} from 'discord.js';
import { t } from 'i18next';
import ms from 'ms';

import { Command } from 'classes/command';

import { createInfraction } from 'db/infraction';
import { getUserLanguage } from 'db/language';
import { getModeration } from 'db/moderation';

import { logger } from 'utils/logger';

import { InfractionType } from 'types/infraction';
import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Moderation,
  botPermissions: ['ModerateMembers', 'SendMessages'],
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Times out a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) => option.setName('user').setDescription('The user to timeout').setRequired(true))
    .addStringOption((option) => option.setName('duration').setDescription('The duration of the timeout').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('The reason for the timeout').setMaxLength(300).setRequired(false)),
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    enum CustomIds {
      Confirm = 'button-timeout-confirm',
      Cancel = 'button-timeout-cancel'
    }

    const { options, guild, member, user } = interaction;

    const target = options.getUser('user', true);
    const targetMember = await guild.members.fetch(target.id).catch((err) => logger.debug({ err, userId: target.id }, 'Could not fetch target member'));
    const targetLng = await getUserLanguage(target.id);

    const config = await getModeration(guild.id, true);

    if (config.staffroleId && !member.permissions.has(PermissionFlagsBits.ModerateMembers) && !member.roles.cache.has(config.staffroleId)) {
      await interaction.editReply(t('moderation.staffrole.error', { lng }));
      return;
    }

    if (!targetMember) {
      await interaction.editReply(t('timeout.target.invalid', { lng }));
      return;
    }

    const reason = options.getString('reason', false);

    if (config.reasonsRequired && !reason) {
      await interaction.editReply(t('moderation.reasons.required-error', { lng }));
      return;
    }

    const userDuration = options.getString('duration', true);
    const duration = ms(userDuration);

    if (!duration) {
      await interaction.editReply(t('timeout.invalid-duration', { lng }));
      return;
    }

    const durationText = ms(duration, { long: true });

    const targetRolePos = targetMember?.roles.highest.position ?? 0;
    const staffRolePos = member.roles.highest.position ?? 0;
    const botRolePos = guild.members.me?.roles.highest.position ?? 0;

    if (targetRolePos >= staffRolePos) {
      await interaction.editReply(t('timeout.target.pos-staff', { lng }));
      return;
    }

    if (targetRolePos >= botRolePos) {
      await interaction.editReply(t('timeout.target.pos-bot', { lng }));
      return;
    }

    if (!targetMember.moderatable) {
      await interaction.editReply(t('timeout.target.moderatable', { lng }));
      return;
    }

    const isTimed = targetMember.isCommunicationDisabled();

    if (isTimed) {
      await interaction.editReply(
        t('timeout.target.timed-out', {
          lng,
          date: time(Math.floor(targetMember.communicationDisabledUntilTimestamp / 1000), TimestampStyles.ShortDateTime)
        })
      );
      return;
    }

    const msg = await interaction.editReply({
      content: t('timeout.confirm', { lng, user: target.toString() }),
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder().setCustomId(CustomIds.Confirm).setEmoji('✔').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(CustomIds.Cancel).setEmoji('✖').setStyle(ButtonStyle.Danger)
        )
      ]
    });

    const collector = await msg.awaitMessageComponent({
      filter: (i) => i.user.id === interaction.user.id,
      componentType: ComponentType.Button,
      time: 30_000
    });

    if (collector.customId === CustomIds.Cancel) {
      await collector.update({
        content: t('timeout.cancelled', { lng }),
        components: []
      });
    } else if (collector.customId === CustomIds.Confirm) {
      const timeout = await targetMember
        .disableCommunicationUntil(Date.now() + duration, reason ?? undefined)
        .catch((err) => logger.debug({ err, target }, 'Could not timeout user'));

      if (!timeout) {
        await collector.update(t('timeout.failed', { lng }));
        return;
      }

      const receivedDM = await client.users
        .send(target.id, {
          content: t('timeout.target-dm', {
            lng: targetLng,
            guild: inlineCode(guild.name),
            reason: inlineCode(reason ?? t('none', { lng })),
            duration: durationText
          })
        })
        .catch((err) => logger.debug({ err, userId: target.id }, 'Could not send DM'));

      await collector.update({
        content: [
          t('timeout.confirmed', {
            lng,
            user: target.toString(),
            reason: inlineCode(reason ?? t('none', { lng }))
          }),
          receivedDM ? t('timeout.dm-received', { lng }) : t('timeout.dm-not-received', { lng }),
          t('timeout.duration', { lng, duration: durationText })
        ].join('\n'),
        components: []
      });

      if (target.bot) {
        return;
      }

      await createInfraction(guild.id, target.id, user.id, InfractionType.Timeout, reason ?? undefined, undefined, Date.now(), false);
    }
  }
});
