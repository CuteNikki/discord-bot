import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

import { Button } from 'classes/button';

import { findGiveawayById, removeParticipant } from 'db/giveaway';

export default new Button({
  customId: 'button-giveaway-leave',
  isCustomIdIncluded: true,
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const giveaway = await findGiveawayById(interaction.customId.split('_')[1]);

    if (!giveaway) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('This giveaway no longer exist!')] });
      return;
    }

    if (giveaway.endsAt < Date.now()) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('This giveaway has ended!')] });
      return;
    }

    if (!giveaway.participants.includes(interaction.user.id)) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('You have not joined this giveaway!')],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('button-giveaway-join').setLabel('Join').setEmoji('🎉').setStyle(ButtonStyle.Primary)
          )
        ]
      });
      return;
    }

    await removeParticipant(giveaway._id, interaction.user.id);
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.giveaway).setDescription('You have left this giveaway!')] });
  }
});
