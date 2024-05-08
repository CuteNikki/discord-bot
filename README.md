<div align="center">
  <h6 > - A WORK IN PROGRESS - </h6>

  <h1>DiscordJS Bot written in TypeScript</h3>

  <p>This discord bot was built with custom classes, <a href="https://www.i18next.com/">i18next</a> for translations, <a href="https://getpino.io/">Pino</a> as logger and <a href="https://www.mongodb.com/">MongoDB</a> as database.</p>

  <a href="https://www.i18next.com/" >
    <img src="https://img.shields.io/badge/translation-i18next-blue?style=for-the-badge" />
  </a>
  <a href="https://getpino.io/" >
    <img src="https://img.shields.io/badge/logger-pino-blue?style=for-the-badge" />
  </a>
  <a href="https://www.mongodb.com/" >
    <img src="https://img.shields.io/badge/database-mongodb-blue?style=for-the-badge" />
  </a>
  <a href="https://github.com/discordjs/discord.js/">
    <img src="https://img.shields.io/badge/discord.js-v14-blue?style=for-the-badge" alt="Discord.JS version 14" />
  </a>
  <br>
  <a href="https://github.com/CuteNikki/discord-bot/stargazers">
    <img src="https://img.shields.io/github/stars/CuteNikki/discord-bot?style=for-the-badge" alt="Repository Stars" />
  </a>
  <a href="https://github.com/CuteNikki/discord-bot/forks">
    <img src="https://img.shields.io/github/forks/CuteNikki/discord-bot?style=for-the-badge" alt="Repository Forks" />
  </a>
  <a href="https://github.com/CuteNikki/discord-bot/issues">
    <img src="https://img.shields.io/github/issues/CuteNikki/discord-bot?style=for-the-badge" alt="Repository Issues" />
  </a>
  <a href="https://opensource.org/licenses/MIT" >
    <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="MIT License" />
  </a>
  <h6>
    Made with 💖 by <a href="https://github.com/CuteNikki/">Nikki</a>
  </h6>
</div>

<hr>

<h3>How to Install and Run the Project</h3>

All it takes is just 7 simple steps.

```bash
# 1. Clone repository
git clone https://github.com/CuteNikki/discord-bot.git

# 2. Navigate into folder:
cd discord-bot

# 3. Install dependencies:
npm install

# 4. Rename example.config.json to config.json
# 5. Fill in the config with your own data.

# 6. Register commands by using registerCommands() function in client class 
#    and then use /register slash command in the future. This is necessary! 
#    We don't want to register our slash commands on each startup.

# 7. Run the bot:
npm run start
```

<hr>

<h3>TO-DO</h3>

- [X] Level Module
  - [x] Weekly levels
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
- [ ] Moderation Module
  - [x] Ban/Tempban command
  - [x] Unban command
  - [x] Kick command
  - [x] Timeout command
  - [x] Warn command
  - [x] Infractions command
  - [ ] Config command
    - [ ] Modrole
- [ ] Utility Module
      Planning on adding more
  - [x] Avatar/Banner command
  - [x] Userinfo command
  - [x] Serverinfo command
  - [x] Weather command
  - [x] Math command
- [ ] Log Module
  - [ ] Config command
- [ ] Welcomer Module
  - [ ] Config command
- [ ] Music Module
- [ ] Custom VC Module
- [ ] Economy Module
- [ ] Fun Module

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
