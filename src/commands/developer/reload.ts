import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';
import path from 'path';

import { Command, Contexts, IntegrationTypes } from 'classes/command';

export default new Command({
  developerOnly: true,
  cooldown: 0,
  data: {
    name: 'reload',
    description: 'Reloads a module',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
    default_member_permissions: `${PermissionFlagsBits.Administrator}`,
    options: [
      {
        name: 'commands',
        description: 'Reloads all commands',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'buttons',
        description: 'Reloads all buttons',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'events',
        description: 'Reloads all events',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'modals',
        description: 'Reloads all modals',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'file',
        description: 'Reloads a file',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'path',
            description: 'The path to file',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  },
  async execute({ interaction, client }) {
    await interaction.deferReply();

    switch (interaction.options.getSubcommand()) {
      case 'file':
        {
          try {
            const filePath = path.join(process.cwd(), interaction.options.getString('path', true));

            delete require.cache[require.resolve(filePath)];
            await import(filePath);

            await interaction.editReply({ content: 'Reloaded file!' });
          } catch (error) {
            await interaction.editReply({ content: 'Could not reload that file!' });
          }
        }
        break;
      case 'commands':
        {
          const foldersPath = path.join(process.cwd(), 'src/commands');
          const commandFolders = fs.readdirSync(foldersPath).filter((file) => !file.endsWith('.txt'));

          for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts'));

            for (const file of commandFiles) {
              const filePath = path.join(commandsPath, file);
              delete require.cache[require.resolve(filePath)];
            }
          }
          await client.reload();
          await interaction.editReply({ content: 'Reloaded all commands.' });
        }
        break;
      case 'events':
        {
          const foldersPath = path.join(process.cwd(), 'src/events');
          const eventFolders = fs.readdirSync(foldersPath).filter((file) => !file.endsWith('.txt'));

          for (const folder of eventFolders) {
            const eventsPath = path.join(foldersPath, folder);
            const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.ts'));

            for (const file of eventFiles) {
              const filePath = path.join(eventsPath, file);
              delete require.cache[require.resolve(filePath)];
            }
          }
          await client.reload();
          await interaction.editReply({ content: 'Reloaded all events.' });
        }
        break;
      case 'buttons':
        {
          const foldersPath = path.join(process.cwd(), 'src/buttons');
          const buttonFolders = fs.readdirSync(foldersPath).filter((file) => !file.endsWith('.txt'));

          for (const folder of buttonFolders) {
            const buttonsPath = path.join(foldersPath, folder);
            const buttonFiles = fs.readdirSync(buttonsPath).filter((file) => file.endsWith('.ts'));

            for (const file of buttonFiles) {
              const filePath = path.join(buttonsPath, file);
              delete require.cache[require.resolve(filePath)];
            }
          }
          await client.reload();
          await interaction.editReply({ content: 'Reloaded all buttons.' });
        }
        break;
      case 'modals':
        {
          const foldersPath = path.join(process.cwd(), 'src/modals');
          const modalFolders = fs.readdirSync(foldersPath).filter((file) => !file.endsWith('.txt'));

          for (const folder of modalFolders) {
            const modalsPath = path.join(foldersPath, folder);
            const modalFiles = fs.readdirSync(modalsPath).filter((file) => file.endsWith('.ts'));

            for (const file of modalFiles) {
              const filePath = path.join(modalsPath, file);
              delete require.cache[require.resolve(filePath)];
            }
          }
          await client.reload();
          await interaction.editReply({ content: 'Reloaded all modals.' });
        }
        break;
    }
  },
});
