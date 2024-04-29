import { Client } from 'discord.js';

const client = new Client({ intents: [] });

client.on('ready', (client: Client<true>) => console.log(`${client.user.tag} is ready!`));

client.login(process.env.DISCORD_BOT_TOKEN);
