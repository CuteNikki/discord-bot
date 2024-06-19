<div align="center">
  <h6 > - A WORK IN PROGRESS - </h6>

  <h1>DiscordJS Bot written in TypeScript</h3>

  <p>This discord bot was built with custom classes, <a href="https://www.i18next.com/">i18next</a> for translations, <a href="https://discord-player.js.org/">Discord Player</a> for music, <a href="https://getpino.io/">Pino</a> as logger and <a href="https://www.mongodb.com/">MongoDB</a> as database.</p>

  <a href="https://www.i18next.com/" >
    <img src="https://img.shields.io/badge/translation-i18next-blue?style=for-the-badge" />
  </a>
  <a href="https://discord-player.js.org/" >
    <img src="https://img.shields.io/badge/music-discord_player-blue?style=for-the-badge" />
  </a>
  <a href="https://getpino.io/" >
    <img src="https://img.shields.io/badge/logger-pino-blue?style=for-the-badge" />
  </a>
  <a href="https://www.mongodb.com/" >
    <img src="https://img.shields.io/badge/database-mongodb-blue?style=for-the-badge" />
  </a>
  <br>
  <a href="https://github.com/discordjs/discord.js/">
    <img src="https://img.shields.io/badge/discord.js-v14-blue?style=for-the-badge" alt="Discord.JS version 14" />
  </a>
  <a href="https://github.com/CuteNikki/discord-bot/stargazers">
    <img src="https://img.shields.io/github/stars/CuteNikki/discord-bot?style=for-the-badge" alt="Repository Stars" />
  </a>
  <a href="https://github.com/CuteNikki/discord-bot/forks">
    <img src="https://img.shields.io/github/forks/CuteNikki/discord-bot?style=for-the-badge" alt="Repository Forks" />
  </a>
  <a href="https://opensource.org/licenses/MIT" >
    <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="MIT License" />
  </a>
  <a href="https://github.com/CuteNikki/discord-bot/issues">
    <img src="https://img.shields.io/github/issues/CuteNikki/discord-bot?style=for-the-badge" alt="Repository Issues" />
  </a>
  <h6>
    Made with 💖 by <a href="https://github.com/CuteNikki/">Nikki</a>
  </h6>
</div>

<hr>

<h3>How to Install and Run the Project</h3>

All it takes is just 8 simple steps.

```bash
# 1. Clone repository
git clone https://github.com/CuteNikki/discord-bot.git

# 2. Navigate into folder:
cd discord-bot

# 3. Install dependencies:
npm install

# 4. Setup your config:
#    Rename example.config.json to config.json
#    Fill in each field (for more details read config).

# 6. Install ffmpeg:
#    It is recommended to install it from the official source.
#    https://ffmpeg.org/download.html
#    Do not recommend installing ffmpeg via npm
#    because binaries pulled from npm are known to be unstable!

# 7. Deploy slash commands:
npm run deploy
#    can also use the /register command on discord
#    after the commands have been registered once.

# 8. Run the bot:
npm run start
```

<hr>

<h3>TO-DO</h3>

- [x] Level Module
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
- [x] Moderation Module
  - [x] Ban/Tempban command
  - [x] Unban command
  - [x] Kick command
  - [x] Timeout command
  - [x] Warn command
  - [x] Infractions command
  - [x] Config command
- [ ] Utility Module
      (Planning on adding more)
  - [x] Avatar/Banner command
  - [x] Userinfo command
  - [x] Serverinfo command
  - [x] Weather command
  - [x] Math command
  - [ ] Config command
- [x] Music Module
- [ ] Log Module
  - [ ] Config command
- [ ] Welcomer Module
  - [ ] Config command
- [ ] Custom VC Module
  - [ ] Config command
- [ ] Economy Module
  - [ ] Config command
- [ ] Fun Module
  - [ ] Config command
- [ ] Ticket Module
  - [ ] Config command
- [ ] Suggestions Module
  - [ ] Config command

<hr>

<h3>Contributing</h3>

Contributions, issues and feature requests are welcome.
Feel free to check <a href="https://github.com/CuteNikki/discord-bot/issues">issues page</a> if you want to contribute.

<hr>

<h3>Show your support</h3>

Please ⭐️ this repository if this project helped you!

<hr>

<h3>License</h3>

Copyright © 2024 <a href="https://github.com/CuteNikki">CuteNikki</a>.
This project is <a href="https://github.com/CuteNikki/discord-bot/blob/main/LICENSE">MIT</a> licensed.

<hr>
