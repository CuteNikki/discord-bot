###### - A WORK IN PROGRESS -

# DiscordJS V14 Bot written in TypeScript

This Discord bot was built with custom classes, [i18next](https://www.i18next.com/) for translations, [Pino](https://getpino.io/) as logger, and [MongoDB](https://www.mongodb.com/) as database.

[![pino](https://img.shields.io/badge/pino-%23687634.svg?style=for-the-badge&logo=pino&logoColor=white)](https://getpino.io) [![mongodb](https://img.shields.io/badge/mongodb-%2347A248.svg?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com) [![i18next](https://img.shields.io/badge/i18next-%2326A69A.svg?style=for-the-badge&logo=i18next&logoColor=white)](https://i18next.com) [![discord.js](https://img.shields.io/badge/discordjs_v14.16.3-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org) [![Repository Stars](https://img.shields.io/github/stars/CuteNikki/discord-bot?style=for-the-badge&color=%23d4a72a)](https://github.com/CuteNikki/discord-bot/stargazers) [![Repository Issues](https://img.shields.io/github/issues/CuteNikki/discord-bot?style=for-the-badge&color=%2371d42a)](https://github.com/CuteNikki/discord-bot/issues) [![Repository Forks](https://img.shields.io/github/forks/CuteNikki/discord-bot?style=for-the-badge&color=%232ad48a)](https://github.com/CuteNikki/discord-bot/forks) [![License](https://img.shields.io/github/license/cutenikki/discord-bot?style=for-the-badge&color=%232a90d4)]()

###### Made with 💖 by [Nikki](https://github.com/CuteNikki/).

## Table of Contents

- [Run it locally](#run-it-locally)
- [How to create new commands, events, buttons and more](#how-to-create-new-commands-events-buttons-and-more)
  - [Creating a slash command](#creating-a-slash-command)
  - [Creating an event](#creating-an-event)
  - [Creating a button](#creating-a-button)
  - [Translating commands](#translating-commands)
  - [Translating messages](#translating-messages)
- [Contributing](#contributing)
- [Show your support](#show-your-support)
- [License](#license)
- [TO-DO](#to-do)

## Run it locally

All it takes is just 6-7 simple steps.

1. Clone the repository.

    ```bash
    git clone https://github.com/CuteNikki/discord-bot.git
    ```

2. Navigate into the project directory.

    ```bash
    cd discord-bot
    ```

3. Install all the dependencies.

    ```bash
    bun install
    ```

4. Set up your config file.

    ```bash
    # copy example.config.json and rename to config.json
    # or use this command if you are on Linux.
    cp example.config.json config.json
    # fill in all values (more details in the config file).
    ```

5. Deploy the slash commands.

    ```bash
    bun run deploy
    # you may also use the /register-commands slash command on discord,
    # once the commands have been registered using the deploy command.
    ```

6. Run the bot using a script.

    ```bash
    # Run in development:
    bun run dev

    # or compile:
    bun run build
    # and run:
    bun run start

    # You may also use --debug for more detailed console logs!
    ```

7. (optional) Configure more settings using the developer command.

    ```bash
    # This is used for giving Supporter Badge on support server boost.
    /developer-configuration support-guild-id set <guildId>

    # This is used for the /support command.
    /developer-configuration support-invite-url set <url>

    # This is used for the /invite command.
    /developer-configuration bot-invite-url set <url>

    # This is used to manage badges of a user.
    /developer-configuration badges add/remove/show <user> [badge]

    # This is used to manage bans.
    /developer-configuration bans add/remove/list [user]
    ```

## How to create new commands, events, buttons and more

### Creating a slash command

This displays the use of i18next, the command class, and all its properties including autocomplete.

```ts
import {
  Colors, // All of default discord colors.
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  InteractionContextType,
  ApplicationIntegrationType,
  type ColorResolvable
} from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { logger } from 'utils/logger';

export default new Command({
  // The module this command belongs to.
  // It categorizes commands in the commands list.
  // It disables this command if the module is disabled.
  module: ModuleType.General,
  // 1 second cooldown between command uses.
  cooldown: 1_000,
  // Only developers can use this command.
  isDeveloperOnly: false,
  // The bot needs to have this permission to be able to use this command.
  botPermissions: ['SendMessages'],
  // The slash command data.
  data: new SlashCommandBuilder()
    .setName('preview-color')
    .setDescription('Sends an embed with a color to preview')
    // Allowing the command to be used in guilds, DMs and private channels.
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    // Allowing the command to be used in guilds, DMs and private channels.
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    // By default only users with the manage messages permission can see and use this command.
    // UNLESS it was changed in the server settings under the integrations tab (per user or role).
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    // Adding options
    .addStringOption(
      (option) =>
        option
          .setName('color')
          .setDescription('The color to preview')
          .setRequired(true) // Makes the option required.
          .setAutocomplete(true) // Enable autocompletion.
    ),
  // On input, the autocomplete function is called.
  async autocomplete({ interaction, client }) {
    // This gets us whatever the user has typed.
    const input = interaction.options.getFocused();

    const colors = [
      { name: 'white', value: Colors.White.toString(16) },
      { name: 'aqua', value: Colors.Aqua.toString(16) },
      { name: 'green', value: Colors.Green.toString(16) },
      { name: 'blue', value: Colors.Blue.toString(16) },
      { name: 'yellow', value: Colors.Yellow.toString(16) },
      { name: 'purple', value: Colors.Purple.toString(16) },
      { name: 'luminous-vivid-pink', value: Colors.LuminousVividPink.toString(16) },
      { name: 'fuchsia', value: Colors.Fuchsia.toString(16) },
      { name: 'gold', value: Colors.Gold.toString(16) },
      { name: 'orange', value: Colors.Orange.toString(16) },
      { name: 'red', value: Colors.Red.toString(16) },
      { name: 'grey', value: Colors.Grey.toString(16) },
      { name: 'navy', value: Colors.Navy.toString(16) },
      { name: 'dark-aqua', value: Colors.DarkAqua.toString(16) },
      { name: 'dark-green', value: Colors.DarkGreen.toString(16) },
      { name: 'dark-blue', value: Colors.DarkBlue.toString(16) },
      { name: 'dark-purple', value: Colors.DarkPurple.toString(16) },
      { name: 'dark-vivid-pink', value: Colors.DarkVividPink.toString(16) },
      { name: 'dark-gold', value: Colors.DarkGold.toString(16) },
      { name: 'dark-orange', value: Colors.DarkOrange.toString(16) },
      { name: 'dark-red', value: Colors.DarkRed.toString(16) },
      { name: 'dark-grey', value: Colors.DarkGrey.toString(16) },
      { name: 'darker-grey', value: Colors.DarkerGrey.toString(16) },
      { name: 'light-grey', value: Colors.LightGrey.toString(16) },
      { name: 'dark-navy', value: Colors.DarkNavy.toString(16) },
      { name: 'blurple', value: Colors.Blurple.toString(16) },
      { name: 'greyple', value: Colors.Greyple.toString(16) },
      { name: 'dark-but-not-black', value: Colors.DarkButNotBlack.toString(16) },
      { name: 'not-quite-black', value: Colors.NotQuiteBlack.toString(16) }
    ];

    // If the input is empty, return all colors but limit to 25!
    // Discord API only allows for a max of 25 choices.
    if (!input.length) {
      await interaction.respond(colors.slice(0, 25));
      return;
    }

    await interaction.respond(
      colors
        // Filter the colors to only respond with the ones that match the input.
        .filter((color) => color.name.toLowerCase().includes(input.toLowerCase()))
        // Again, making sure we only ever return max of 25 results.
        .slice(0, 25)
    );
  },
  // On command, the execute function is called.
  // order of interaction, client and lng does not matter.
  async execute({ interaction, client, lng }) {
    // get a guilds language:
    // import { getGuildLanguage } from 'db/language';
    // const guildLng = await getGuildLanguage(guildId);

    // get a different users language:
    // import { getUserLanguage } from 'db/language';
    // const otherLng = await getUserLanguage(userId);

    // get the color the user provided
    const color = interaction.options.getString('color', true);

    // Autocomplete allows you to give the user a list to choose from,
    // but they will still be able to type in whatever they want!
    // it's a must to check if they actually provided a valid color.

    try {
      // Send the embed with the color preview if the color is valid.
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            // We get a type error here without the casting.
            .setColor(color as ColorResolvable)
            .setDescription(t('preview-color.preview', { lng, color }))
        ]
      });
    } catch (err) {
      // This block runs if an invalid color is provided.

      logger.debug({ err }, 'Error while previewing color');

      // In case something else went wrong and the reply was actually sent, edit it.
      if (!interaction.replied) {
        await interaction.reply({ content: t('preview-color.invalid', { lng }), ephemeral: true });
      } else {
        await interaction.editReply({ content: t('preview-color.invalid', { lng }) });
      }
    }
  }
});
```

### Creating an event

```ts
import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  // the name of the event
  name: Events.ClientReady,
  // only run this once, won't run again even if another ready event is emitted
  once: true,
  // it is important to always have client first
  // and other events properties after that
  execute(client, readyClient) {
    logger.info(`Logged in as ${readyClient.user.username}#${readyClient.user.discriminator}`);
  }
});
```

### Creating a button

```ts
import { Button } from 'classes/button';

export default new Button({
  // The module this button belongs to.
  module: ModuleType.General,
  // The custom identifier of the button.
  customId: 'ping',
  // If the button was received by a command, only the command sender can use this button.
  isAuthorOnly: true,
  // If true then a button with the custom id of "abc-ping-abc" would still
  // trigger this button because the custom id includes "ping".
  // This is useful to pass an id or other information to the button.
  isCustomIdIncluded: false, // In this case, we don't need it.
  // The permissions required by a member to use this button.
  permissions: ['SendMessages'], // Ignored in DMs.
  // Permissions the bot needs to execute this function.
  botPermissions: ['SendMessages'], // Ignored in DMs.
  // On button click, the execute function is called.
  async execute({ interaction, client, lng }) {
    await interaction.channel?.send({ content: 'pong!' }); // Send a response in the channel.
  }
});
```

### Translating commands

`src/structure/locales/{lng}-commands.json`

```json
{
  "preview-color": {
    "name": "preview-color",
    "description": "Sends an embed with a color to preview",
    "options": [
      {
        "name": "color",
        "description": "The color to preview"
      }
    ]
  }
}
```

### Translating messages

`src/structure/locales/{lng}-messages.json`

```json
{
  "preview-color": {
    "preview": "Here's a preview of the color {{color}}!",
    "invalid": "The color you provided is invalid!"
  }
}
```

## Contributing

Contributions, issues, and feature requests are welcome.
Feel free to check the [issues page](https://github.com/CuteNikki/discord-bot/issues) if you want to contribute.

## Show your support

Please ⭐️ this repository if this project helped you!

## License

Copyright © 2024 [CuteNikki](https://github.com/CuteNikki).
This project is [MIT](https://github.com/CuteNikki/discord-bot/blob/main/LICENSE) licensed.

## TO-DO

- [x] utility module (more features might be added)
- [x] developer module (more features might be added)
- [ ] fun module (more features will be added)
  - [x] game command
    - [ ] 2048 (maybe?)
    - [ ] Lights Out (maybe?)
- [ ] config
  - [x] reaction roles (already implemented)
    - [ ] fully customizable message
  - [ ] word chain game (next word needs to start with the last letter of the previous word)
  - [ ] economy
    - [x] config
    - [x] balance
    - [x] deposit
    - [x] withdraw
    - [x] pay
    - [x] inventory
    - [x] daily
    - [x] transfer
    - [x] marry
    - [x] divorce
    - [x] leaderboard
    - [x] rob
    - [x] work
    - [x] bet
    - [x] coinflip
    - [x] profile
    - [x] profile context
    - [ ] shop
  - [ ] confession
    - [ ] config command
    - [ ] confess
  - [ ] suggestions
    - [ ] config command
    - [ ] suggest
  - [ ] level config
    - [x] text and voice levelling is fully implemented with ignored & enabled channels, announcements, reward and multiplier roles
    - [x] levelup announcement
      - [ ] fully customizable message
