import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { findGiveawayById, removeParticipantById } from 'db/giveaway';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import { ModuleType } from 'types/interactions';

export default new Button({
  module: ModuleType.Config,
  customId: 'button-giveaway-leave',
  isCustomIdIncluded: true,
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const giveaway = await findGiveawayById(interaction.customId.split('_')[1]);

    const guildLng = await getGuildLanguage(interaction.guildId);

    if (!giveaway) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.common.invalid-giveaway', { lng }))]
      });
      return;
    }

    if (giveaway.endsAt < Date.now()) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.common.inactive', { lng }))] });
      return;
    }

    if (!giveaway.participants.includes(interaction.user.id)) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.leave.not-participant', { lng }))],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('button-giveaway-join').setLabel(t('giveaway.join.label', { lng })).setEmoji('🎉').setStyle(ButtonStyle.Primary)
          )
        ]
      });
      return;
    }

    await removeParticipantById(giveaway._id, interaction.user.id);
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.leave.success', { lng }))] });

    const msg = await interaction.channel?.messages.fetch(giveaway.messageId);

    if (msg)
      await msg
        .edit({
          embeds: [
            EmbedBuilder.from(msg.embeds[0]).setFields(
              ...msg.embeds[0].fields.slice(0, 3).map((field) => ({ name: field.name, value: field.value, inline: field.inline ? true : false })),
              {
                name: t('giveaway.message.participant', { lng: guildLng, count: giveaway.participants.length }),
                value: (giveaway.participants.length - 1).toString()
              }
            )
          ]
        })
        .catch((err) => logger.debug({ err }, 'Could not edit giveaway message'));
  }
});
