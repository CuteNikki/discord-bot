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

import { Command, ModuleType } from 'classes/command';

import { InfractionType, infractionModel } from 'models/infraction';

import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.Moderation,
  botPermissions: ['KickMembers', 'SendMessages'],
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) => option.setName('user').setDescription('The user to kick').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('The reason for the kick').setMaxLength(300).setRequired(false)),
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply({ ephemeral: true });

    enum CustomIds {
      Confirm = 'KICK_CONFIRM',
      Cancel = 'KICK_CANCEL',
    }

    const { options, guild, member, user } = interaction;

    const target = options.getUser('user', true);
    const targetMember = await guild.members.fetch(target.id).catch((error) => logger.debug({ error, userId: target.id }, 'Could not fetch target member'));
    if (!targetMember)
      return interaction.editReply(
        t('kick.target.invalid', {
          lng: await client.getUserLanguage(interaction.user.id),
        }),
      );

    const reason = options.getString('reason', false) ?? undefined;

    const targetRolePos = targetMember.roles.highest.position ?? 0;
    const staffRolePos = member.roles.highest.position ?? 0;
    const botRolePos = guild.members.me?.roles.highest.position ?? 0;

    if (targetRolePos >= staffRolePos)
      return interaction.editReply(
        t('kick.target.pos_staff', {
          lng: await client.getUserLanguage(interaction.user.id),
        }),
      );
    if (targetRolePos >= botRolePos)
      return interaction.editReply(
        t('kick.target.pos_bot', {
          lng: await client.getUserLanguage(interaction.user.id),
        }),
      );

    if (!targetMember.kickable)
      return interaction.editReply(
        t('kick.target.kickable', {
          lng: await client.getUserLanguage(interaction.user.id),
        }),
      );

    const msg = await interaction.editReply({
      content: t('kick.confirm', {
        lng: await client.getUserLanguage(interaction.user.id),
        user: target.toString(),
      }),
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder().setCustomId(CustomIds.Confirm).setEmoji('✔').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(CustomIds.Cancel).setEmoji('✖').setStyle(ButtonStyle.Danger),
        ),
      ],
    });

    const collector = await msg.awaitMessageComponent({
      filter: (i) => i.user.id === interaction.user.id,
      componentType: ComponentType.Button,
      time: 30_000,
    });

    if (collector.customId === CustomIds.Cancel) {
      await collector.update({
        content: t('kick.cancelled', {
          lng: await client.getUserLanguage(interaction.user.id),
        }),
        components: [],
      });
    } else if (collector.customId === CustomIds.Confirm) {
      const kicked = await targetMember.kick(reason).catch((error) => logger.debug({ error, userId: target.id }, 'Could not kick user'));
      if (!kicked)
        return collector.update(
          t('kick.failed', {
            lng: await client.getUserLanguage(interaction.user.id),
          }),
        );

      const receivedDM = await client.users
        .send(target.id, {
          content: t('kick.target_dm', {
            lng: await client.getUserLanguage(target.id),
            guild: `\`${guild.name}\``,
            reason: `\`${reason ?? '/'}\``,
          }),
        })
        .catch((error) => logger.debug({ error, userId: target.id }, 'Could not send DM'));
      await collector.update({
        content: [
          t('kick.confirmed', {
            lng: await client.getUserLanguage(interaction.user.id),
            user: target.toString(),
            reason: `\`${reason ?? '/'}\``,
          }),
          receivedDM
            ? t('kick.dm_received', {
                lng: await client.getUserLanguage(interaction.user.id),
              })
            : t('kick.dm_not_received', {
                lng: await client.getUserLanguage(interaction.user.id),
              }),
        ].join('\n'),
        components: [],
      });

      if (target.bot) return;
      await infractionModel.create({
        guildId: guild.id,
        userId: target.id,
        staffId: user.id,
        action: InfractionType.Kick,
        createdAt: Date.now(),
        reason,
      });
    }
  },
});
