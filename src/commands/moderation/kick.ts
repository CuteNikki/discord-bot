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

import { Command, Contexts, IntegrationTypes } from 'classes/command';

import { InfractionType, infractionModel } from 'models/infraction';

export default new Command({
  data: {
    name: 'kick',
    description: 'Kicks a user',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
    default_member_permissions: `${PermissionFlagsBits.KickMembers}`,
    options: [
      {
        name: 'user',
        description: 'The user to kick',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'reason',
        description: 'The reason for the kick',
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
      CONFIRM = 'KICK_CONFIRM',
      CANCEL = 'KICK_CANCEL',
    }

    const { options, guild, member, user } = interaction;

    const target = options.getUser('user', true);

    const lng = await client.getLanguage(interaction.user.id);
    const targetLng = await client.getLanguage(target.id);

    const targetMember = await guild.members.fetch(target.id).catch(() => {});
    if (!targetMember) return interaction.editReply(i18next.t('kick.target.invalid', { lng }));

    const reason = options.getString('reason', false) ?? undefined;

    const targetRolePos = targetMember.roles.highest.position ?? 0;
    const staffRolePos = member.roles.highest.position ?? 0;
    const botRolePos = guild.members.me?.roles.highest.position ?? 0;

    if (targetRolePos >= staffRolePos) return interaction.editReply(i18next.t('kick.target.pos_staff', { lng }));
    if (targetRolePos >= botRolePos) return interaction.editReply(i18next.t('kick.target.pos_bot', { lng }));

    if (!targetMember.kickable) return interaction.editReply(i18next.t('kick.target.kickable', { lng }));

    const msg = await interaction.editReply({
      content: i18next.t('kick.confirm', { lng, user: target.toString() }),
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder().setCustomId(CustomIds.CONFIRM).setEmoji('✔').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(CustomIds.CANCEL).setEmoji('✖').setStyle(ButtonStyle.Danger)
        ),
      ],
    });

    const collector = await msg.awaitMessageComponent({ filter: (i) => i.user.id === interaction.user.id, componentType: ComponentType.Button, time: 30_000 });

    if (collector.customId === CustomIds.CANCEL) {
      await collector.update({ content: i18next.t('kick.cancelled', { lng }), components: [] });
    } else if (collector.customId === CustomIds.CONFIRM) {
      const kicked = await targetMember.kick(reason).catch(() => {});
      if (!kicked) return collector.update(i18next.t('kick.failed', { lng }));

      const receivedDM = await client.users
        .send(target.id, {
          content: i18next.t('kick.target_dm', {
            lng: targetLng,
            guild: `\`${guild.name}\``,
            reason: `\`${reason ?? '/'}\``,
          }),
        })
        .catch(() => {});
      await collector.update({
        content: [
          i18next.t('kick.confirmed', { lng, user: target.toString(), reason: `\`${reason ?? '/'}\`` }),
          receivedDM ? i18next.t('kick.dm_received', { lng }) : i18next.t('kick.dm_not_received', { lng }),
        ].join('\n'),
        components: [],
      });

      if (target.bot) return;
      await infractionModel.create({
        guildId: guild.id,
        userId: target.id,
        moderatorId: user.id,
        action: InfractionType.KICK,
        createdAt: Date.now(),
        reason,
      });
    }
  },
});
