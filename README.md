> ###### **Note:** This bot is a work in progress. Some features may be incomplete or require further testing.

# Discord Bot v2

Welcome to the official repository for the v2 of the Discord Bot! This bot is designed to enhance your Discord server by offering a wide variety of features such as moderation tools and much more. The bot is built with flexibility in mind, allowing for easy expansion and customization.

## Features

- [ ] **Moderation Commands**: Moderate your server with features like banning, muting, and kicking.
- [ ] **Reaction Roles**: Assign roles based on user reactions to messages.
- [ ] **Welcome Messages**: Greet new members with personalized messages.
- [ ] **Fun Commands**: Various fun commands to keep the server engaged.

## Installation

### Prerequisites

- Bun installed ([Website](https://bun.sh/)).
- Discord bot token ([Discord Developer Portal guide](https://discord.com/developers/docs/intro)).
- Database ([Supported by Prisma](https://www.prisma.io/docs/orm/overview/databases)).

### Setup

1. Clone the repository:

```sh
git clone -b v2 --single-branch https://github.com/CuteNikki/DiscordBot.git
```

2. Install the dependencies:

```sh
bun install
```

3. Create a `.env` file in the root directory and add your bot's token and database URL.

```sh
# You can copy this file to .env and fill in the values

# !! if you don't use postgresql, you will need to change the 'provider' in ROOT/prisma/schema.prisma file!!
DATABASE_URL="postgresql://user:password@localhost/your-database" # Required (database)

# !! remove the https://discord.com/api/webhooks/ part from the webhook URL !!
WEBHOOK_BLACKLIST="123123123123123123/abc123abc123abc123" # Optional (notifications)

DISCORD_BOT_TOKEN="abc123abc123abc123" # Required (bot & cmd registration)
DISCORD_BOT_ID="123123123123123123" # Required (cmd registration)
DISCORD_DEV_GUILD_ID="123123123123123123" # Optional (dev cmd registration)
```

4. Run the bot:

```sh
bun run start
```

## Configuration

All bot configuration is done through the `.env` file located in the root directory. You can change various settings like webhooks.

## Community

Join our Discord community for support, updates, and more: [Discord Link](https://discord.gg/ACR6RBQj4y)

## Contributing

We welcome contributions! If you'd like to help improve the bot, feel free to fork the repository, submit issues, or open pull requests.

### Steps to contribute:

1. Fork the repo
2. Create a new branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature-name`)
5. Open a pull request

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.
