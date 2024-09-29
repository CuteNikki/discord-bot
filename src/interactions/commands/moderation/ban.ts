import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder
} from 'discord.js';
import { t } from 'i18next';
import ms from 'ms';

import { Command, ModuleType } from 'classes/command';

import { createInfraction } from 'db/infraction';
import { getUserLanguage } from 'db/user';

import { InfractionType } from 'types/infraction';

import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.Moderation,
  botPermissions: ['BanMembers', 'SendMessages'],
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) => option.setName('user').setDescription('The user to ban').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('The reason for the ban').setMaxLength(300).setRequired(false))
    .addStringOption((option) => option.setName('duration').setDescription('The duration of the ban').setRequired(false))
    .addIntegerOption((option) =>
      option
        .setName('history')
        .setDescription('How much of the users message history to delete')
        .setRequired(false)
        .addChoices(
          { name: 'Delete none', value: 0 },
          { name: 'Previous 30 minutes', value: 1800 },
          { name: 'Previous 60 minutes', value: 3600 },
          { name: 'Previous 3 hours', value: 10800 },
          { name: 'Previous 6 hours', value: 21600 },
          { name: 'Previous 12 hours', value: 43200 },
          { name: 'Previous 24 hours', value: 86400 },
          { name: 'Previous 3 days', value: 259200 },
          { name: 'Previous 7 days', value: 604800 }
        )
    ),
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    enum CustomIds {
      Confirm = 'BAN_CONFIRM',
      Cancel = 'BAN_CANCEL'
    }

    const { options, guild, member, user } = interaction;

    const target = options.getUser('user', true);
    const targetMember = await guild.members.fetch(target.id).catch((err) => logger.debug({ err, userId: target.id }, 'Could not fetch target member'));

    const targetLng = await getUserLanguage(target.id);

    const userDuration = options.getString('duration', false);
    const duration = ms(userDuration ?? '0');
    const durationText = ms(duration, { long: true });

    const reason = options.getString('reason', false) ?? undefined;
    const history = options.getInteger('history', false) ?? 604800;
    const historyOptions = {
      0: t('ban.history.none', { lng }), // 'Delete none'
      1800: t('ban.history.minutes_30', { lng }), // 'Previous 30 minutes'
      3600: t('ban.history.minutes_60', { lng }), // 'Previous 60 minutes'
      10800: t('ban.history.hours_3', { lng }), // 'Previous 3 hours'
      21600: t('ban.history.hours_6', { lng }), //'Previous 6 hours'
      43200: t('ban.history.hours_12', { lng }), // 'Previous 12 hours'
      86400: t('ban.history.hours_24', { lng }), // 'Previous 24 hours'
      259200: t('ban.history.days_3', { lng }), // 'Previous 3 days'
      604800: t('ban.history.days_7', { lng }) // 'Previous 7 days'
    };

    const targetRolePos = targetMember?.roles.highest.position ?? 0;
    const staffRolePos = member.roles.highest.position ?? 0;
    const botRolePos = guild.members.me?.roles.highest.position ?? 0;

    if (targetRolePos >= staffRolePos) {
      await interaction.editReply(t('ban.target.pos_staff', { lng }));
      return;
    }

    if (targetRolePos >= botRolePos) {
      await interaction.editReply(t('ban.target.pos_bot', { lng }));
      return;
    }

    if (targetMember && !targetMember.bannable) {
      await interaction.editReply(t('ban.target.bannable', { lng }));
      return;
    }

    const isBanned = await guild.bans.fetch(target.id).catch((err) => logger.debug({ err, userId: target.id }, 'Could not fetch target ban'));

    if (isBanned) {
      await interaction.editReply(t('ban.target.banned', { lng }));
      return;
    }

    const msg = await interaction.editReply({
      content: t('ban.confirm', { lng, user: target.toString() }),
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
        content: t('ban.cancelled', { lng }),
        components: []
      });
    } else if (collector.customId === CustomIds.Confirm) {
      const banned = await guild.bans
        .create(target.id, { reason, deleteMessageSeconds: history })
        .catch((err) => logger.debug({ err, userId: target.id }, 'Could not ban user'));

      if (!banned) {
        await collector.update(t('ban.failed', { lng }));
        return;
      }

      const receivedDM = await client.users
        .send(target.id, {
          content: t('ban.target_dm', {
            lng: targetLng,
            guild: `\`${guild.name}\``,
            reason: `\`${reason ?? '/'}\``,
            duration: duration ? durationText : 'forever'
          })
        })
        .catch((err) => logger.debug({ err, userId: target.id }, 'Could not send DM'));

      await collector.update({
        content: [
          t('ban.confirmed', {
            lng,
            user: target.toString(),
            reason: `\`${reason ?? '/'}\``
          }),
          t('ban.deleted_history', {
            lng,
            deleted: historyOptions[history as keyof typeof historyOptions]
          }),
          receivedDM ? t('ban.dm_received', { lng }) : t('ban.dm_not_received', { lng }),
          duration ? t('ban.duration', { lng, duration: durationText }) : t('ban.permanent', { lng })
        ].join('\n'),
        components: []
      });

      if (target.bot) {
        return;
      }

      await createInfraction(
        guild.id,
        target.id,
        user.id,
        duration ? InfractionType.TempBan : InfractionType.Ban,
        reason,
        duration ? Date.now() + duration : undefined,
        Date.now(),
        duration ? false : true
      );
    }
  }
});
