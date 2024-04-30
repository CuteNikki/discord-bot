<h1>DiscordJS Bot written in TypeScript</h1>

This discord bot was built with custom classes, [i18next](https://www.i18next.com/) for translations, [pino](https://getpino.io/) as logger and [mongodb](https://www.mongodb.com/) as database.

<a href="https://github.com/CuteNikki/discord-bot/stargazers">
  <img src="https://img.shields.io/github/stars/CuteNikki/discord-bot?style=for-the-badge" alt="Repository Stars" />
</a>
<a href="https://github.com/CuteNikki/discord-bot/forks">
  <img src="https://img.shields.io/github/forks/CuteNikki/discord-bot?style=for-the-badge" alt="Repository Forks" />
</a>
<a href="https://github.com/CuteNikki/discord-bot/issues">
  <img src="https://img.shields.io/github/issues/CuteNikki/discord-bot?style=for-the-badge" alt="Repository Issues" />
</a>
<a href="https://github.com/discordjs/discord.js/">
  <img src="https://img.shields.io/badge/discord.js-v14-blue?style=for-the-badge" alt="Discord.JS version 14" />
</a>
<a href="https://opensource.org/licenses/MIT" >
  <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="MIT License" />
</a>
<!-- <a href="https://www.i18next.com/" >
  <img src="https://img.shields.io/badge/translation-i18next-blue?style=for-the-badge" />
</a>
<a href="https://getpino.io/" >
  <img src="https://img.shields.io/badge/logger-pino-blue?style=for-the-badge" />
</a>
<a href="https://www.mongodb.com/" >
  <img src="https://img.shields.io/badge/database-mongodb-blue?style=for-the-badge" />
</a> -->

###### Made with 💖 by [Nikki](https://github.com/CuteNikki/)

## Setup Process:

This project was created using [Bun](https://bun.sh) v1.1.6. (a faster all-in-one JavaScript runtime).

```bash
# Install Bun on Windows:
powershell -c "irm bun.sh/install.ps1 | iex"
# Or install Bun on Linux/MacOS:
curl -fsSL https://bun.sh/install | bash

# Clone repository
git clone https://github.com/CuteNikki/discord-bot.git

# Navigate into folder:
cd discord-bot

# Install dependencies:
bun install

# Now rename example.config.json to config.json
# Fill in the config with your own data

# Run the bot:
bun run index.ts
# Or without sharding:
bun run ./src/bot.ts
```

## TO-DO:

- Moderation
- Logging
- Welcomer
- Utility
- Music
- Custom VC
- Levelling
- Economy
- Fun (Games, etc.)
