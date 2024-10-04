import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { addParticipant, findGiveawayByMessage } from 'db/giveaway';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-giveaway-join',
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const giveaway = await findGiveawayByMessage(interaction.message.id);

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

    if (giveaway.participants.includes(interaction.user.id)) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.join.already-participant', { lng }))],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`button-giveaway-leave_${giveaway._id.toString()}`)
              .setLabel(t('giveaway.leave.label', { lng }))
              .setStyle(ButtonStyle.Danger)
          )
        ]
      });
      return;
    }

    await addParticipant(giveaway._id, interaction.user.id);
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.giveaway).setDescription(t('giveaway.join.success', { lng }))]
    });

    await interaction.message
      .edit({
        embeds: [
          EmbedBuilder.from(interaction.message.embeds[0]).setFields(
            ...interaction.message.embeds[0].fields.slice(0, 3).map((field) => ({ name: field.name, value: field.value, inline: field.inline ? true : false })),
            {
              name: t('giveaway.message.participant', { lng: guildLng, count: giveaway.participants.length }),
              value: (giveaway.participants.length + 1).toString()
            }
          )
        ]
      })
      .catch((err) => logger.debug({ err }, 'Could not edit giveaway message'));
  }
});
