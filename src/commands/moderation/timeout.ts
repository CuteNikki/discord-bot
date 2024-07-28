import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { t } from 'i18next';
import ms from 'ms';

import { Command, ModuleType } from 'classes/command';

import { InfractionType, infractionModel } from 'models/infraction';

import { logger } from 'utils/logger';

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
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply({ ephemeral: true });

    enum CustomIds {
      Confirm = 'TIMEOUT_CONFIRM',
      Cancel = 'TIMEOUT_CANCEL',
    }

    const { options, guild, member, user } = interaction;

    const target = options.getUser('user', true);

    const lng = await client.getUserLanguage(interaction.user.id);
    const targetLng = await client.getUserLanguage(target.id);

    const targetMember = await guild.members.fetch(target.id).catch((error) => logger.debug({ error, userId: target.id }, 'Could not fetch target member'));
    if (!targetMember) return interaction.editReply(t('timeout.target.invalid', { lng }));

    const userDuration = options.getString('duration', true);
    const duration = ms(userDuration);
    if (!duration) return interaction.editReply(t('timeout.invalid_duration', { lng }));
    const durationText = ms(duration, { long: true });

    const reason = options.getString('reason', false) ?? undefined;

    const targetRolePos = targetMember?.roles.highest.position ?? 0;
    const staffRolePos = member.roles.highest.position ?? 0;
    const botRolePos = guild.members.me?.roles.highest.position ?? 0;

    if (targetRolePos >= staffRolePos) return interaction.editReply(t('timeout.target.pos_staff', { lng }));
    if (targetRolePos >= botRolePos) return interaction.editReply(t('timeout.target.pos_bot', { lng }));

    if (!targetMember.moderatable) return interaction.editReply(t('timeout.target.moderatable', { lng }));

    const isTimed = targetMember.isCommunicationDisabled();
    if (isTimed)
      return interaction.editReply(
        t('timeout.target.timed_out', { lng, date: `<t:${Math.floor(targetMember.communicationDisabledUntilTimestamp / 1000)}:f>` })
      );

    const msg = await interaction.editReply({
      content: t('timeout.confirm', { lng, user: target.toString() }),
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder().setCustomId(CustomIds.Confirm).setEmoji('✔').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(CustomIds.Cancel).setEmoji('✖').setStyle(ButtonStyle.Danger)
        ),
      ],
    });

    const collector = await msg.awaitMessageComponent({ filter: (i) => i.user.id === interaction.user.id, componentType: ComponentType.Button, time: 30_000 });

    if (collector.customId === CustomIds.Cancel) {
      await collector.update({ content: t('timeout.cancelled', { lng }), components: [] });
    } else if (collector.customId === CustomIds.Confirm) {
      const timeout = await targetMember.disableCommunicationUntil(Date.now() + duration, reason).catch((error) => logger.debug({ error, userId: target.id }, 'Could not timeout user'));
      if (!timeout) return collector.update(t('timeout.failed', { lng }));

      const receivedDM = await client.users
        .send(target.id, {
          content: t('timeout.target_dm', {
            lng: targetLng,
            guild: `\`${guild.name}\``,
            reason: `\`${reason ?? '/'}\``,
            duration: durationText,
          }),
        })
        .catch((error) => logger.debug({ error, userId: target.id }, 'Could not send DM'));
      await collector.update({
        content: [
          t('timeout.confirmed', { lng, user: target.toString(), reason: `\`${reason ?? '/'}\`` }),
          receivedDM ? t('timeout.dm_received', { lng }) : t('timeout.dm_not_received', { lng }),
          t('timeout.duration', { lng, duration: durationText }),
        ].join('\n'),
        components: [],
      });

      if (target.bot) return;
      await infractionModel.create({
        guildId: guild.id,
        userId: target.id,
        staffId: user.id,
        action: InfractionType.Timeout,
        closed: false,
        endsAt: Date.now() + duration,
        createdAt: Date.now(),
        reason,
      });
    }
  },
});
