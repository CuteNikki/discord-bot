import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import { CardBuilder } from 'classes/card-builder';
import { Command } from 'classes/command';

export default new Command({
  builder: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Shows a profile')
    .addUserOption((option) => option.setName('user').setDescription('The user to show the profile of').setRequired(false)),
  async execute(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const user = interaction.options.getUser('user') || interaction.user;

    const profileImage = new CardBuilder()
      .setUsername(user.displayName)
      .setAvatarUrl(user.displayAvatarURL({ extension: 'png', size: 256 }))
      .setTopText('Profile')
      .setBackgroundUrl('src/assets/profile.jpg');
    interaction.editReply({ files: [await profileImage.build()] });
  },
});
