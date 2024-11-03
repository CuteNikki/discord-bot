## Economy System

### Overview

Users can manage their money through a wallet or a bank account. The system provides various commands to interact with their finances and items.

### Features

- **Wallet and Bank**: Manage money in the wallet or bank.
- **Marriage System**: Marry another user and display the status on the profile.
- **Profiles**: Display badges, marriage status, and other information.
- **Gambling System**: Engage in various gambling activities to win or lose money.

### Notation

- `[]` = optional argument
- `<>` = required argument

### Financial Commands

| Command                | Description                                              | Implemented |
| ---------------------- | -------------------------------------------------------- | ----------- |
| `/balance [user]`      | Check the amount of money in the wallet and bank         | ✅          |
| `/deposit <amount>`    | Move money from the wallet to the bank                   | ✅          |
| `/withdraw <amount>`   | Move money from the bank to the wallet                   | ✅          |
| `/pay <user> <amount>` | Send money to another user                               | ❌          |
| `/rob <user>`          | Steal money from another user's wallet (1-hour cooldown) | ❌          |
| `/daily`               | Claim the daily reward                                   | ❌          |
| `/leaderboard`         | View top users based on wealth.                          | ❌          |

### Item Commands

| Command                   | Description                                                      | Implemented |
| ------------------------- | ---------------------------------------------------------------- | ----------- |
| `/work mine`              | Mine for items and money (1-hour cooldown, requires pickaxe)     | ❌          |
| `/work fish`              | Fish for items and money (1-hour cooldown, requires fishing rod) | ❌          |
| `/shop`                   | Buy and sell items                                               | ❌          |
| `/transfer <item> <user>` | Give items to another user                                       | ❌          |
| `/inventory`              | Check the current inventory of items                             | ✅          |

### Marriage Commands

| Command         | Description                                 | Implemented |
| --------------- | ------------------------------------------- | ----------- |
| `/marry <user>` | Marry another user (requires marriage ring) | ❌          |
| `/divorce`      | End a marriage (ring not returned)          | ❌          |

### Gambling Commands

| Command              | Description                                  | Implemented |
| -------------------- | -------------------------------------------- | ----------- |
| `/bet <amount>`      | Place a bet and try to win more money        | ❌          |
| `/slots <amount>`    | Play a slot machine game                     | ❌          |
| `/coinflip <amount>` | Flip a coin and double your money if you win | ❌          |
| `/dice <amount>`     | Roll a dice and win based on the outcome     | ❌          |

### Profile Commands

| Command                     | Description                   | Implemented |
| --------------------------- | ----------------------------- | ----------- |
| `/profile view [user]`      | View the profile of a user    | ❌          |
| `/profile edit description` | Edit your profile description | ❌          |
