import { DiscordClient } from 'classes/client';

const client = new DiscordClient();

client.on('ready', (client) => console.log(`${client.user.tag} is ready!`));

client.login(process.env.DISCORD_BOT_TOKEN);
