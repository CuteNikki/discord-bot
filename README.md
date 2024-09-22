###### - A WORK IN PROGRESS -

# DiscordJS V14 Bot written in TypeScript

This discord bot was built with custom classes, <a href="https://www.i18next.com/">i18next</a> for translations, <a href="https://getpino.io/">Pino</a> as logger and <a href="https://www.mongodb.com/">MongoDB</a> as database.</p>

[<img src="https://img.shields.io/badge/pino-%23687634.svg?style=for-the-badge&logo=pino&logoColor=white" alt="pino" />](https://getpino.io) [<img src="https://img.shields.io/badge/mongodb-%2347A248.svg?style=for-the-badge&logo=mongodb&logoColor=white" alt="mongodb" />](https://mongodb.com) [<img src="https://img.shields.io/badge/i18next-%2326A69A.svg?style=for-the-badge&logo=i18next&logoColor=white" alt="i18next" />](https://i18next.com) [<img src="https://img.shields.io/badge/discordjs_v14-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white" alt="discord.js" />](https://discord.js.org)<br /> [<img src="https://img.shields.io/github/stars/CuteNikki/discord-bot?style=for-the-badge&color=%23d4a72a" alt="Repository Stars" />](https://github.com/CuteNikki/discord-bot/stargazers) [<img src="https://img.shields.io/github/issues/CuteNikki/discord-bot?style=for-the-badge&color=%2371d42a" alt="Repository Issues" />](https://github.com/CuteNikki/discord-bot/issues) [<img src="https://img.shields.io/github/forks/CuteNikki/discord-bot?style=for-the-badge&color=%232ad48a" alt="Repository Forks" />](https://github.com/CuteNikki/discord-bot/forks) [<img src="https://img.shields.io/github/license/cutenikki/discord-bot?style=for-the-badge&color=%232a90d4" alt="License" />]()

###### Made with 💖 by <a href="https://github.com/CuteNikki/">Nikki</a>

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
npm install
```

4. Set up your config file.

```bash
# copy example.config.json and rename to config.json
# fill in all values (more details in the config file)
```

5. Deploy the slash commands.

```bash
npm run deploy
# you may also use the /register command on discord
# once the commands have been registered using the above command.
```

6. Run the bot using a script.

```bash
# run in development
npm run dev
# or compile and run
npm run build
npm run start

# you may also use --debug for more detailed logs in case something goes wrong!
```

7. (optional) Configure more settings using the developer command.

## How to create new commands, events, buttons, etc.

#### 1. Creating a slash command using the custom command class and i18next.

This displays the use of all command properties including autocomplete.

```ts
import {
  Colors, // all discord colors
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ColorResolvable,
} from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.General,
  // the module this command belongs to
  // it categorizes commands in the commands list
  cooldown: 1_000,
  // 1 second cooldown between command uses
  isDeveloperOnly: false,
  // only developers can use this command
  botPermissions: ['SendMessages'],
  // the bot needs to have this permission to be able to use this command
  data: new SlashCommandBuilder()
    .setName('preview-color')
    // command name
    .setDescription('Sends an embed with a color to preview')
    // command description
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    // only users with the manage messages permission can see and use this command
    .addStringOption(
      (option) =>
        option
          .setName('color')
          // option name
          .setDescription('The color to preview')
          // option description
          .setRequired(true)
          // makes the option required
          .setAutocomplete(true),
      // enables autocompletion
    ),
  async autocomplete({ interaction, client }) {
    const input = interaction.options.getFocused();
    // This gets us whatever the user has typed in the autocomplete
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
      { name: 'not-quite-black', value: Colors.NotQuiteBlack.toString(16) },
    ];
    if (!input.length) return await interaction.respond(colors.slice(0, 25));
    await interaction.respond(
      colors
        .filter(
          (color) => color.name.toLowerCase().includes(input.toLowerCase()),
          // Check if the input includes the color name
        )
        .slice(0, 25),
    );
    // Making sure we only ever return max of 25 results
  },
  async execute({ interaction, client }) {
    // the order of client and interaction does not matter

    const color = interaction.options.getString('color', true);

    // get a users language
    const lng = await client.getUserLanguage(interaction.user.id);
    // get a guilds language
    // const lng = await client.getGuildLanguage(interaction.guildId);

    // Autocomplete allows you to give the user a list to choose from
    // but they will still be able to type in whatever they want!
    // it's a must to check if they actually provided a valid color.
    try {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(color as ColorResolvable)
            // casting the color to a color resolvable
            .setDescription(t('preview-color.preview', { lng, color })),
        ],
      });
    } catch (err) {
      logger.debug({ err }, 'Error while previewing color');
      if (!interaction.replied) {
        await interaction.reply({ content: t('preview-color.invalid', { lng }) });
      } else {
        await interaction.editReply({ content: t('preview-color.invalid', { lng }) });
      }
    }
  },
});
```

##### Translating messages

`src/structure/locales/{lng}-messages.json`

```json
{
  "preview-color": {
    "preview": "Heres a preview of the color {{color}}!",
    "invalid": "The color you provided is invalid!"
  }
}
```

##### Translating commands

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

#### 2. Creating an event using the custom event class.

```ts
import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.ClientReady,
  // the name of the event
  once: true,
  // only run this once, won't run again even if another ready event is emitted
  execute(client, readyClient) {
    // it is important to always have client first
    // the events properties after that

    logger.info(`Logged in as ${readyClient.user.username}#${readyClient.user.discriminator}`);
  },
});
```

#### 3. Creating a button using the custom button class.

```ts
import { Button } from 'classes/button';

export default new Button({
  customId: 'ping',
  // the custom id of the button
  isAuthorOnly: true,
  // if the button was sent using a command, only the author can use this button
  isCustomIdIncluded: false,
  // if true then a button with the custom id of "ping-two" would still trigger this button
  permissions: ['SendMessages'],
  // the permissions required to use this button
  botPermissions: ['SendMessages'],
  // the bot permissions the bot needs to have to use this button
  async execute({ interaction, client }) {
    await interaction.reply({ content: 'pong!' });
  },
});
```

## Contributing

Contributions, issues and feature requests are welcome.
Feel free to check <a href="https://github.com/CuteNikki/discord-bot/issues">issues page</a> if you want to contribute.

## Show your support

Please ⭐️ this repository if this project helped you!

## License

Copyright © 2024 <a href="https://github.com/CuteNikki">CuteNikki</a>.
This project is <a href="https://github.com/CuteNikki/discord-bot/blob/main/LICENSE">MIT</a> licensed.

## TO-DO

- [ ] refactor config commands
  - [x] counting (new)
  - [x] custom voice channels (new)
  - [x] starboard (new)
  - [x] welcome
  - [x] farewell
  - [x] ticket
  - [ ] level
  - [ ] log
- [ ] miscellaneous
  - [x] fully translated all messages sent by the bot
  - [x] added locales to all registered slash commands
  - [ ] replace any null/undefined, true/false and so on with proper translations
- [x] moderation module
  - [x] infractions command
    - [x] slash and user context menu commands
  - [x] purge command
    - [x] filter by specific user, channel and before/after a message
  - [x] ban command
  - [x] tempban command
  - [x] unban command
  - [x] kick command
  - [x] timeout command
  - [x] warn command
- [x] general module
  - [x] language command
    - [x] editable user language
    - [x] editable server language (mainly used for the ticket system and the server log)
  - [x] bot information
    - [x] botinfo command
    - [x] clusters command
    - [x] ping command
    - [x] uptime command
  - [x] list of commands
  - [x] support command
  - [x] invite command
- [x] level module
  - [x] automatically resets weekly level
  - [x] rank command (with weekly option)
  - [x] leaderboard command (with weekly option)
  - [x] modify users level/xp with config command
- [ ] utility module
  - [x] avatar/banner slash and user context menu commands
  - [x] userinfo slash and user context menu commands
  - [x] serverinfo command
  - [x] weather command
  - [x] reminder command (weatherapi.com)
- [ ] developer module
  - [x] evaluate code
  - [x] execute console command
  - [x] register commands
- [ ] fun module
  - [x] phone command
    - [x] add property for last sent message (if no message sent within 4 minutes, automatically end the call)
    - [x] could add a button to enter the queue again if phone was hung up
  - [x] game command
    - [x] Rock-Paper-Scissors
    - [x] Tic-Tac-Toe
    - [x] Connect-4
    - [x] Trivia
    - [x] Hangman
    - [x] Memory
    - [x] Snake
    - [x] Fast-Type
    - [x] Remember-Emoji
    - [x] Tetris
    - [x] Sokoban
- [ ] config commands
  - [x] custom voice channels
  - [x] counting game
  - [ ] giveaway
  - [ ] economy
  - [ ] confession
  - [ ] suggestions
  - [x] starboard
    - [x] enable/disable module
    - [x] starboard messages can be deleted or edited by the author
    - [x] users can only star a message once and can also remove their star
  - [x] moderation config
    - [x] enable/disable module
    - [ ] staff role (?)
    - [ ] option to make reasons required (optional by default)
  - [x] level config
    - [x] disable/enable module
    - [x] modify users level/xp
    - [x] levelup announcement
      - [x] sent to current/other channel or dms
    - [x] ignored roles and channels
    - [x] enabled channels
  - [x] welcome config
    - [x] disable/enable module
    - [x] fully customizable welcome messages
    - [x] add roles on join
  - [x] farewell config
    - [x] disable/enable module
    - [x] fully customizable farewell messages
  - [x] ticket config
    - [x] disable/enable module
    - [x] fully customizable ticket options
  - [x] developer config
    - [x] update invite url and support settings
    - [x] globally ban users
    - [x] custom badges
      - [x] supporter badge automatically added on support server boost
      - [x] List of badges:
        - developer
        - staff member
        - translator
        - supporter
        - expert bughunter
        - bughunter
  - [x] server log config
    - [x] enable/disable events
      - [x] applicationCommandPermissionUpdate
      - [x] autoModerationActionExecution
      - [x] autoModerationRuleCreate
      - [x] autoModerationRuleDelete
      - [x] autoModerationRuleUpdate
      - [x] channelCreate
      - [x] channelDelete
      - [x] channelUpdate
      - [x] emojiCreate
      - [x] emojiDelete
      - [x] emojiUpdate
      - [x] guildBanAdd
      - [x] guildBanRemove
      - [x] guildMemberAdd
        - [x] warns about potentially dangerous users and gives option to ban/kick them
      - [x] guildMemberRemove
      - [x] guildMemberUpdate
      - [x] guildScheduledEventCreate
      - [x] guildScheduledEventDelete
      - [x] guildScheduledEventUpdate
      - [x] guildScheduledEventUserAdd
      - [x] guildScheduledEventUserRemove
      - [x] guildUpdate
      - [x] inviteCreate
      - [x] inviteDelete
      - [x] messageUpdate
      - [x] messageDelete
      - [x] messageBulkDelete
      - [x] messageReactionRemoveAll
      - [x] roleCreate
      - [x] roleDelete
      - [x] roleUpdate
      - [x] stickerCreate
      - [x] stickerDelete
      - [x] stickerUpdate
      - [x] threadCreate
      - [x] threadDelete
      - [x] threadUpdate
      - [x] voiceStateUpdate
