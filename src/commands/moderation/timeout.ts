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

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';

import { InfractionType, infractionModel } from 'models/infraction';

export default new Command({
  module: Modules.MODERATION,
  data: {
    name: 'timeout',
    description: 'Times out a user',
    default_member_permissions: `${PermissionFlagsBits.ModerateMembers}`,
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
    options: [
      {
        name: 'user',
        description: 'The user to timeout',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'duration',
        description: 'The duration of the timeout',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'reason',
        description: 'The reason for the timeout',
        type: ApplicationCommandOptionType.String,
        max_length: 180,
        required: false,
      },
    ],
  },
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply({ ephemeral: true });

    enum CustomIds {
      CONFIRM = 'TIMEOUT_CONFIRM',
      CANCEL = 'TIMEOUT_CANCEL',
    }

    const { options, guild, member, user } = interaction;

    const target = options.getUser('user', true);

    const lng = await client.getLanguage(interaction.user.id);
    const targetLng = await client.getLanguage(target.id);

    const targetMember = await guild.members.fetch(target.id).catch(() => {});
    if (!targetMember) return interaction.editReply(i18next.t('timeout.target.invalid', { lng }));

    const userDuration = options.getString('duration', true);
    const duration = ms(userDuration);
    if (!duration) return interaction.editReply(i18next.t('timeout.invalid_duration', { lng }));
    const durationText = ms(duration, { long: true });

    const reason = options.getString('reason', false) ?? undefined;

    const targetRolePos = targetMember?.roles.highest.position ?? 0;
    const staffRolePos = member.roles.highest.position ?? 0;
    const botRolePos = guild.members.me?.roles.highest.position ?? 0;

    if (targetRolePos >= staffRolePos) return interaction.editReply(i18next.t('timeout.target.pos_staff', { lng }));
    if (targetRolePos >= botRolePos) return interaction.editReply(i18next.t('timeout.target.pos_bot', { lng }));

    if (!targetMember.moderatable) return interaction.editReply(i18next.t('timeout.target.moderatable', { lng }));

    const isTimed = targetMember.isCommunicationDisabled();
    if (isTimed)
      return interaction.editReply(
        i18next.t('timeout.target.timed_out', { lng, date: `<t:${Math.floor(targetMember.communicationDisabledUntilTimestamp / 1000)}:f>` })
      );

    const msg = await interaction.editReply({
      content: i18next.t('timeout.confirm', { lng, user: target.toString() }),
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder().setCustomId(CustomIds.CONFIRM).setEmoji('✔').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(CustomIds.CANCEL).setEmoji('✖').setStyle(ButtonStyle.Danger)
        ),
      ],
    });

    const collector = await msg.awaitMessageComponent({ filter: (i) => i.user.id === interaction.user.id, componentType: ComponentType.Button, time: 30_000 });

    if (collector.customId === CustomIds.CANCEL) {
      await collector.update({ content: i18next.t('timeout.cancelled', { lng }), components: [] });
    } else if (collector.customId === CustomIds.CONFIRM) {
      const timeout = await targetMember.disableCommunicationUntil(Date.now() + duration, reason).catch(() => {});
      if (!timeout) return collector.update(i18next.t('timeout.failed', { lng }));

      const receivedDM = await client.users
        .send(target.id, {
          content: i18next.t('timeout.target_dm', {
            lng: targetLng,
            guild: `\`${guild.name}\``,
            reason: `\`${reason ?? '/'}\``,
            duration: durationText,
          }),
        })
        .catch(() => {});
      await collector.update({
        content: [
          i18next.t('timeout.confirmed', { lng, user: target.toString(), reason: `\`${reason ?? '/'}\`` }),
          receivedDM ? i18next.t('timeout.dm_received', { lng }) : i18next.t('timeout.dm_not_received', { lng }),
          i18next.t('timeout.duration', { lng, duration: durationText }),
        ].join('\n'),
        components: [],
      });

      if (target.bot) return;
      await infractionModel.create({
        guildId: guild.id,
        userId: target.id,
        moderatorId: user.id,
        action: InfractionType.TIMEOUT,
        ended: false,
        endsAt: Date.now() + duration,
        createdAt: Date.now(),
        reason,
      });
    }
  },
});
