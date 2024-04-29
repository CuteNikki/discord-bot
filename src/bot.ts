import { DiscordClient } from 'classes/client';
import { Events } from 'discord.js';
const client = new DiscordClient();

client.on(Events.InteractionCreate, (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      interaction.reply({ content: 'Could not find that command!', ephemeral: true });
      return;
    }
    command.options.execute({ client, interaction });
  }
});
