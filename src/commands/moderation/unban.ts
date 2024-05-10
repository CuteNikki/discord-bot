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

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';

import { InfractionType, infractionModel } from 'models/infraction';

export default new Command({
  module: Modules.MODERATION,
  data: {
    name: 'unban',
    description: 'Unban a user',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
    default_member_permissions: `${PermissionFlagsBits.BanMembers}`,
    options: [
      {
        name: 'user',
        description: 'The user to unban',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'reason',
        description: 'The reason for the unban',
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
      CONFIRM = 'UNBAN_CONFIRM',
      CANCEL = 'UNBAN_CANCEL',
    }

    const { options, guild, user } = interaction;

    const target = options.getUser('user', true);

    const lng = await client.getLanguage(interaction.user.id);
    const targetLng = await client.getLanguage(target.id);

    const reason = options.getString('reason', false) ?? undefined;

    const isBanned = await guild.bans.fetch(target.id).catch(() => {});
    if (!isBanned) return interaction.editReply(i18next.t('unban.target_not_banned', { lng }));

    const msg = await interaction.editReply({
      content: i18next.t('unban.confirm', { lng, user: target.toString() }),
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder().setCustomId(CustomIds.CONFIRM).setEmoji('✔').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(CustomIds.CANCEL).setEmoji('✖').setStyle(ButtonStyle.Danger)
        ),
      ],
    });

    const collector = await msg.awaitMessageComponent({ filter: (i) => i.user.id === interaction.user.id, componentType: ComponentType.Button, time: 30_000 });

    if (collector.customId === CustomIds.CANCEL) {
      await collector.update({ content: i18next.t('unban.cancelled', { lng }), components: [] });
    } else if (collector.customId === CustomIds.CONFIRM) {
      const banned = await guild.bans.remove(target.id, reason).catch(() => {});
      if (!banned) return collector.update(i18next.t('unban.failed', { lng }));

      const receivedDM = await client.users
        .send(target.id, {
          content: i18next.t('unban.target_dm', {
            lng: targetLng,
            guild: `\`${guild.name}\``,
            reason: `\`${reason ?? '/'}\``,
          }),
        })
        .catch(() => {});
      await collector.update({
        content: [
          i18next.t('unban.confirmed', { lng, user: target.toString(), reason: `\`${reason ?? '/'}\`` }),
          receivedDM ? i18next.t('unban.dm_received', { lng }) : i18next.t('unban.dm_not_received', { lng }),
        ].join('\n'),
        components: [],
      });

      if (target.bot) return;
      await infractionModel.create({
        guildId: guild.id,
        userId: target.id,
        moderatorId: user.id,
        action: InfractionType.UNBAN,
        createdAt: Date.now(),
        reason,
      });
    }
  },
});
