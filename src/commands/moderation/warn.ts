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

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

import { InfractionType, infractionModel } from 'models/infraction';

export default new Command({
  module: ModuleType.Moderation,
  data: {
    name: 'warn',
    description: 'Warn a user',
    default_member_permissions: `${PermissionFlagsBits.ModerateMembers}`,
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.Guild],
    integration_types: [IntegrationTypes.GuildInstall],
    options: [
      {
        name: 'user',
        description: 'The user to warn',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'reason',
        description: 'The reason for the warn',
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
      Confirm = 'WARN_CONFIRM',
      Cancel = 'WARN_CANCEL',
    }

    const { options, guild, user } = interaction;

    const target = options.getUser('user', true);

    const lng = await client.getUserLanguage(interaction.user.id);
    const targetLng = await client.getUserLanguage(target.id);

    const reason = options.getString('reason', false) ?? undefined;

    const msg = await interaction.editReply({
      content: i18next.t('warn.confirm', { lng, user: target.toString() }),
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder().setCustomId(CustomIds.Confirm).setEmoji('✔').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(CustomIds.Cancel).setEmoji('✖').setStyle(ButtonStyle.Danger)
        ),
      ],
    });

    const collector = await msg.awaitMessageComponent({ filter: (i) => i.user.id === interaction.user.id, componentType: ComponentType.Button, time: 30_000 });

    if (collector.customId === CustomIds.Cancel) {
      await collector.update({ content: i18next.t('warn.cancelled', { lng }), components: [] });
    } else if (collector.customId === CustomIds.Confirm) {
      const receivedDM = await client.users
        .send(target.id, {
          content: i18next.t('warn.target_dm', {
            lng: targetLng,
            guild: `\`${guild.name}\``,
            reason: `\`${reason ?? '/'}\``,
          }),
        })
        .catch(() => {});
      await collector.update({
        content: [
          i18next.t('warn.confirmed', { lng, user: target.toString(), reason: `\`${reason ?? '/'}\`` }),
          receivedDM ? i18next.t('warn.dm_received', { lng }) : i18next.t('warn.dm_not_received', { lng }),
        ].join('\n'),
        components: [],
      });

      if (target.bot) return;
      await infractionModel.create({
        guildId: guild.id,
        userId: target.id,
        moderatorId: user.id,
        action: InfractionType.Warn,
        createdAt: Date.now(),
        reason,
      });
    }
  },
});
