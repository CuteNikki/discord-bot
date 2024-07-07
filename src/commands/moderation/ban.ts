import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionFlagsBits,
} from 'discord.js';
import i18next from 'i18next';
import ms from 'ms';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

import { InfractionType, infractionModel } from 'models/infraction';

export default new Command({
  module: ModuleType.MODERATION,
  data: {
    name: 'ban',
    description: 'Bans a user',
    default_member_permissions: `${PermissionFlagsBits.BanMembers}`,
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
    options: [
      {
        name: 'user',
        description: 'The user to ban',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'reason',
        description: 'The reason for the ban',
        type: ApplicationCommandOptionType.String,
        max_length: 180,
        required: false,
      },
      {
        name: 'duration',
        description: 'The duration of the ban',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
      {
        name: 'history',
        description: 'How much of the users message history to delete',
        type: ApplicationCommandOptionType.Integer,
        required: false,
        choices: [
          { name: 'Delete none', value: 0 },
          { name: 'Previous 30 minutes', value: 1800 },
          { name: 'Previous 60 minutes', value: 3600 },
          { name: 'Previous 3 hours', value: 10800 },
          { name: 'Previous 6 hours', value: 21600 },
          { name: 'Previous 12 hours', value: 43200 },
          { name: 'Previous 24 hours', value: 86400 },
          { name: 'Previous 3 days', value: 259200 },
          { name: 'Previous 7 days', value: 604800 },
        ],
      },
    ],
  },
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply({ ephemeral: true });

    enum CustomIds {
      CONFIRM = 'BAN_CONFIRM',
      CANCEL = 'BAN_CANCEL',
    }

    const { options, guild, member, user } = interaction;

    const target = options.getUser('user', true);
    const targetMember = await guild.members.fetch(target.id).catch(() => {});

    const lng = await client.getUserLanguage(interaction.user.id);
    const targetLng = await client.getUserLanguage(target.id);

    const userDuration = options.getString('duration', false);
    const duration = ms(userDuration ?? '0');
    const durationText = ms(duration, { long: true });

    const reason = options.getString('reason', false) ?? undefined;
    const history = options.getInteger('history', false) ?? 604800;
    const historyOptions = {
      0: i18next.t('ban.history.none', { lng }), // 'Delete none'
      1800: i18next.t('ban.history.minutes_30', { lng }), // 'Previous 30 minutes'
      3600: i18next.t('ban.history.minutes_60', { lng }), // 'Previous 60 minutes'
      10800: i18next.t('ban.history.hours_3', { lng }), // 'Previous 3 hours'
      21600: i18next.t('ban.history.hours_6', { lng }), //'Previous 6 hours'
      43200: i18next.t('ban.history.hours_12', { lng }), // 'Previous 12 hours'
      86400: i18next.t('ban.history.hours_24', { lng }), // 'Previous 24 hours'
      259200: i18next.t('ban.history.days_3', { lng }), // 'Previous 3 days'
      604800: i18next.t('ban.history.days_7', { lng }), // 'Previous 7 days'
    };

    const targetRolePos = targetMember?.roles.highest.position ?? 0;
    const staffRolePos = member.roles.highest.position ?? 0;
    const botRolePos = guild.members.me?.roles.highest.position ?? 0;

    if (targetRolePos >= staffRolePos) return interaction.editReply(i18next.t('ban.target.pos_staff', { lng }));
    if (targetRolePos >= botRolePos) return interaction.editReply(i18next.t('ban.target.pos_bot', { lng }));

    if (targetMember && !targetMember.bannable) return interaction.editReply(i18next.t('ban.target.bannable', { lng }));

    const isBanned = await guild.bans.fetch(target.id).catch(() => {});
    if (isBanned) return interaction.editReply(i18next.t('ban.target.banned', { lng }));

    const msg = await interaction.editReply({
      content: i18next.t('ban.confirm', { lng, user: target.toString() }),
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder().setCustomId(CustomIds.CONFIRM).setEmoji('✔').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(CustomIds.CANCEL).setEmoji('✖').setStyle(ButtonStyle.Danger)
        ),
      ],
    });

    const collector = await msg.awaitMessageComponent({ filter: (i) => i.user.id === interaction.user.id, componentType: ComponentType.Button, time: 30_000 });

    if (collector.customId === CustomIds.CANCEL) {
      await collector.update({ content: i18next.t('ban.cancelled', { lng }), components: [] });
    } else if (collector.customId === CustomIds.CONFIRM) {
      const banned = await guild.bans.create(target.id, { reason, deleteMessageSeconds: history }).catch(() => {});
      if (!banned) return collector.update(i18next.t('ban.failed', { lng }));

      const receivedDM = await client.users
        .send(target.id, {
          content: i18next.t('ban.target_dm', {
            lng: targetLng,
            guild: `\`${guild.name}\``,
            reason: `\`${reason ?? '/'}\``,
            duration: duration ? durationText : 'forever',
          }),
        })
        .catch(() => {});
      await collector.update({
        content: [
          i18next.t('ban.confirmed', { lng, user: target.toString(), reason: `\`${reason ?? '/'}\`` }),
          i18next.t('ban.deleted_history', { lng, deleted: historyOptions[history as keyof typeof historyOptions] }),
          receivedDM ? i18next.t('ban.dm_received', { lng }) : i18next.t('ban.dm_not_received', { lng }),
          duration ? i18next.t('ban.duration', { lng, duration: durationText }) : i18next.t('ban.permanent', { lng }),
        ].join('\n'),
        components: [],
      });

      if (target.bot) return;
      await infractionModel.create({
        guildId: guild.id,
        userId: target.id,
        moderatorId: user.id,
        action: duration ? InfractionType.TEMPBAN : InfractionType.BAN,
        closed: duration ? false : true,
        endsAt: duration ? Date.now() + duration : undefined,
        createdAt: Date.now(),
        reason,
      });
    }
  },
});
