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

import { Command, ModuleType } from 'classes/command';

import { createInfraction } from 'db/infraction';
import { getUserLanguage } from 'db/user';

import { InfractionType } from 'types/infraction';

import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.Moderation,
  botPermissions: ['BanMembers', 'SendMessages'],
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((option) => option.setName('user').setDescription('The user to unban').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('The reason for the unban').setMaxLength(300).setRequired(false)),
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    enum CustomIds {
      Confirm = 'UNBAN_CONFIRM',
      Cancel = 'UNBAN_CANCEL'
    }

    const { options, guild, user } = interaction;

    const target = options.getUser('user', true);
    const targetLng = await getUserLanguage(target.id);

    const reason = options.getString('reason', false) ?? undefined;

    const isBanned = await guild.bans.fetch(target.id).catch((err) => logger.debug({ err, userId: target.id }, 'Could not fetch target ban'));

    if (!isBanned) {
      await interaction.editReply(t('unban.target.not_banned', { lng }));
      return;
    }

    const msg = await interaction.editReply({
      content: t('unban.confirm', { lng, user: target.toString() }),
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
        content: t('unban.cancelled', { lng }),
        components: []
      });
    } else if (collector.customId === CustomIds.Confirm) {
      const unbanned = await guild.bans.remove(target.id, reason).catch((err) => logger.debug({ err, userId: target.id }, 'Could not unban user'));

      if (!unbanned) {
        await collector.update(t('unban.failed', { lng }));
        return;
      }

      const receivedDM = await client.users
        .send(target.id, {
          content: t('unban.target_dm', {
            lng: targetLng,
            guild: `\`${guild.name}\``,
            reason: `\`${reason ?? '/'}\``
          })
        })
        .catch(() => {});

      await collector.update({
        content: [
          t('unban.confirmed', {
            lng,
            user: target.toString(),
            reason: `\`${reason ?? '/'}\``
          }),
          receivedDM ? t('unban.dm_received', { lng }) : t('unban.dm_not_received', { lng })
        ].join('\n'),
        components: []
      });

      if (target.bot) {
        return;
      }

      await createInfraction(guild.id, target.id, user.id, InfractionType.Unban, reason, undefined, Date.now(), true);
    }
  }
});
