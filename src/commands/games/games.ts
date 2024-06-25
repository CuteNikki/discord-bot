import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';

import { Connect4 } from 'games/connect4';
import { RockPaperScissors } from 'games/rock-paper-scissors';
import { TicTacToe } from 'games/tic-tac-toe';

export default new Command({
  module: Modules.GAMES,
  data: {
    name: 'games',
    description: 'Choose one of the fun games to play',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD, Contexts.BOT_DM, Contexts.PRIVATE_CHANNEL],
    integration_types: [IntegrationTypes.GUILD_INSTALL, IntegrationTypes.USER_INSTALL],
    options: [
      {
        name: 'rock-paper-scissors',
        description: 'Play a game of rock, paper and scissors!',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'opponent',
            description: 'The user to play against',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'tic-tac-toe',
        description: 'Play a game of Tic Tac Toe!',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'opponent',
            description: 'The user to play against',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: 'connect4',
        description: 'Play a game of Connect4!',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'opponent',
            description: 'The user to play against',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: 'scale',
            description: 'The scale of connect4',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
              {
                name: 'Original (7x6)',
                value: 'original',
              },
              {
                name: 'Small (6x5)',
                value: 'small',
              },
              {
                name: 'Medium (8x7)',
                value: 'medium',
              },
              {
                name: 'Big (10x9)',
                value: 'big',
              },
            ],
          },
        ],
      },
    ],
  },
  async execute({ interaction, client }) {
    await interaction.deferReply();

    const { options } = interaction;

    switch (options.getSubcommand()) {
      case 'rock-paper-scissors':
        {
          const opponent = options.getUser('opponent', false);

          const game = new RockPaperScissors({
            interaction,
            opponent,
            client,
          });
          game.start();
        }
        break;
      case 'tic-tac-toe':
        {
          const opponent = options.getUser('opponent', true);

          const game = new TicTacToe({
            interaction,
            opponent,
            client,
          });
          game.start();
        }
        break;
      case 'connect4':
        {
          const opponent = options.getUser('opponent', true);

          let scale;

          // Original Connect4 is 7x6
          // Highest supported is 10x9
          // Max supported amount of buttons per row is 5
          switch (options.getString('scale', false)) {
            case 'big':
              scale = {
                width: 10,
                height: 9,
                max_buttons: 5,
              };
              break;
            case 'medium':
              scale = {
                width: 8,
                height: 7,
                max_buttons: 4,
              };
              break;
            case 'small':
              scale = {
                width: 6,
                height: 5,
                max_buttons: 3,
              };
              break;
            case 'original':
              scale = {
                width: 7,
                height: 6,
                max_buttons: 4,
              };
              break;
            default:
              scale = {
                width: 7,
                height: 6,
                max_buttons: 4,
              };
              break;
          }

          const game = new Connect4({
            interaction,
            opponent,
            client,
            scale,
          });
          game.start();
        }
        break;
    }
  },
});
