###### - A WORK IN PROGRESS -
# DiscordJS Bot written in TypeScript
This discord bot was built with custom classes, <a href="https://www.i18next.com/">i18next</a> for translations, <a href="https://getpino.io/">Pino</a> as logger and <a href="https://www.mongodb.com/">MongoDB</a> as database.</p>

![i18next](https://img.shields.io/badge/translation-i18next-blue?style=for-the-badge) ![Pino](https://img.shields.io/badge/logger-pino-blue?style=for-the-badge) ![MongoDB](https://img.shields.io/badge/database-mongodb-blue?style=for-the-badge) <br /> ![Discord.JS version 14](https://img.shields.io/badge/discord.js-v14-blue?style=for-the-badge) ![Repository Stars](https://img.shields.io/github/stars/CuteNikki/discord-bot?style=for-the-badge) ![Repository Forks](https://img.shields.io/github/forks/CuteNikki/discord-bot?style=for-the-badge) ![MIT License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge) ![Repository Issues](https://img.shields.io/github/issues/CuteNikki/discord-bot?style=for-the-badge)

###### Made with 💖 by <a href="https://github.com/CuteNikki/">Nikki</a>

## Run Locally
All it takes is just 6 simple steps.

1 - Clone the repository
```bash
git clone https://github.com/CuteNikki/discord-bot.git
```
2 - Go to the project directory
```bash
cd discord-bot
```
3 - Install dependencies
```bash
npm install
```
4 - Setup your config
```bash
# Copy example.config.json and rename to config.json
# Fill in all values (more details in the config file)
```
5 - Deploy slash commands
```bash
npm run deploy
# You may also use the /register command on discord
# once the commands have been registered using the above command.
```
6 - Run the bot
```bash
# Run in development
npm run dev
# Or compile and run
npm run build
npm run start
```
7 - Use the config-developer command to configure more settings (optional)

## Contributing
Contributions, issues and feature requests are welcome.
Feel free to check <a href="https://github.com/CuteNikki/discord-bot/issues">issues page</a> if you want to contribute.

## Show your support
Please ⭐️ this repository if this project helped you!

## License
Copyright © 2024 <a href="https://github.com/CuteNikki">CuteNikki</a>.
This project is <a href="https://github.com/CuteNikki/discord-bot/blob/main/LICENSE">MIT</a> licensed.

## TO-DO
- [x] General module
  - [x] Commands command
  - [x] Language command
  - [x] Support command
  - [x] Invite command
  - [x] Bot information
    - [x] Botinfo command
    - [x] Clusters command
    - [x] Ping command
    - [x] Uptime command
- [x] Moderation module
  - [x] Ban/Tempban command
  - [x] Unban command
  - [x] Kick command
  - [x] Timeout command
  - [x] Warn command
  - [x] Infractions command
  - [x] Purge command
  - [x] Config command
- [x] Level module
  - [x] Weekly level
  - [x] Rank command (with weekly option)
  - [x] Leaderboard command (with weekly option)
  - [x] Config command
    - [x] Modify users level/XP
    - [x] Levelup announcement
      - [x] Can be sent to current/other channel or dms
    - [x] Ignored roles
          (Users with role will not receive any XP)
    - [x] Ignored channels
          (Messages in channel will not give any XP)
    - [x] Enabled channels
          (When set will only enable level module in those channels)
  - [x] Stop command
  - [x] Leave command
  - [x] Skip command
  - [x] Back command
  - [x] Pause/Resume command
  - [x] Now playing command
  - [x] Queue command
  - [x] History command
  - [x] Shuffle command
  - [x] Seek command
  - [x] Volume command
  - [x] Lyrics command
    - [x] Autocompletion
  - [x] Loop command
    - [x] Autoplay
    - [x] Track
    - [x] Queue
  - [x] Filter commands
    - [x] Bassboost
    - [x] 8D
    - [x] Vocalboost
  - [x] Remove track commands
    - [x] Duplicates
    - [x] Range
    - [x] User
    - [x] ID
  - [x] Config command
- [x] Welcome module
  - [x] Config command
  - [x] Events
- [x] Farewell module
  - [x] Config command
  - [x] Events
- [x] Ticket module
  - [x] Config command
- [x] Log module
  - [x] Config command
  - [x] Events
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
- [ ] Utility module
  - [x] Avatar/Banner command
  - [x] Userinfo command
  - [x] Serverinfo command
  - [x] Weather command
  - [x] Reminder command
  - [ ] Config command
  - [ ] Custom VC
    - [ ] Config command
    - [ ] Events
- [ ] Developer Module
  - [x] Evaluate command
  - [x] Execute command
  - [x] Register command
  - [x] Config command
    - [x] Update invite url and support settings
    - [x] Banned users
    - [x] Custom badges
      - [x] Add supporter badge on server boost
      - [x] List of badges:
        - Developer
        - Moderator
        - Translator
        - Supporter
        - Expert Bughunter
        - Bughunter
- [ ] Fun module
  - [x] Phone command
  - [x] Game command
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
  - [ ] Config command
- [ ] Economy module
  - [ ] Config command
- [ ] Giveaway module
  - [ ] Config command
- [ ] Suggestions module
  - [ ] Config command
- [ ] Confession module
  - [ ] Config command
