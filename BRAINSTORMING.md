<br/>

# Economy System

<br/>

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

### Config Commands

| Command    | Description                                     | Implemented |
| ---------- | ----------------------------------------------- | ----------- |
| `/economy` | Enable/Disable the economy module on the server | ✅          |

### Financial Commands

| Command                | Description                                              | Implemented |
| ---------------------- | -------------------------------------------------------- | ----------- |
| `/balance [user]`      | Check the amount of money in the wallet and bank         | ✅          |
| `/deposit <amount>`    | Move money from the wallet to the bank                   | ✅          |
| `/withdraw <amount>`   | Move money from the bank to the wallet                   | ✅          |
| `/pay <user> <amount>` | Send money to another user                               | ✅          |
| `/rob <user>`          | Steal money from another user's wallet (1-hour cooldown) | ✅          |
| `/daily`               | Claim the daily reward                                   | ✅          |
| `/leaderboard`         | View top users based on wealth.                          | ✅          |

### Item Commands

| Command                   | Description                                                  | Implemented |
| ------------------------- | ------------------------------------------------------------ | ----------- |
| `/work <job>`             | Get items and money (1-hour cooldown, requires tool for job) | ✅          |
| `/transfer <item> <user>` | Give items to another user                                   | ✅          |
| `/inventory [user]`       | Check the current inventory of items                         | ✅          |
| `/shop`                   | Buy and sell items                                           | ❌          |

### Marriage Commands

| Command         | Description                                 | Implemented |
| --------------- | ------------------------------------------- | ----------- |
| `/marry <user>` | Marry another user (requires marriage ring) | ✅          |
| `/divorce`      | End a marriage (ring not returned)          | ✅          |

### Gambling Commands

| Command              | Description                                  | Implemented |
| -------------------- | -------------------------------------------- | ----------- |
| `/bet <amount>`      | Place a bet and try to win more money        | ✅          |
| `/slots <amount>`    | Play a slot machine game                     | ❌          |
| `/coinflip <amount>` | Flip a coin and double your money if you win | ❌          |
| `/dice <amount>`     | Roll a dice and win based on the outcome     | ❌          |

### Profile Commands

| Command                     | Description                   | Implemented |
| --------------------------- | ----------------------------- | ----------- |
| `/profile view [user]`      | View the profile of a user    | ❌          |
| `/profile edit description` | Edit your profile description | ❌          |

<br/>

<hr/>

<br/>

# Confession System

<br/>

### Overview

Users can make confessions which are anonymous by default but can be made public.

### Commands

| Command       | Description                     | Implemented |
| ------------- | ------------------------------- | ----------- |
| `/confess`    | Make a confession               | ❌          |
| `/confession` | Configure the confession module | ❌          |

### Database Structure

Confession:

```ts
export type ConfessionDocument = {
  _id: Types.ObjectId; // Mongoose unique Id
  authorId: string; // Submitter (not visible to other or staff when anonymous)
  guildId: string; // Guild
  channelId: string; // Confession channel
  messageId: string; // Message sent to the confession channel
  confession: string; // Text of the confession
  anonymous: boolean; // Anonymous (default: true)
};
```

Module:

```ts
export type ConfessionConfigDocument = {
  _id: Types.ObjectId; // Mongoose unique Id
  guildId: string; // Guild this configuration is for
  enabled: boolean; // Whether module is enabled or not (default: false)
  channelId: string; // Confession will be send here
};
```

<br/>

<hr/>

<br/>

# Suggestion System

<br/>

### Overview

Users can make suggestions. Suggestions are voted on by users and then accepted or denied by staff.

### Commands

| Command       | Description                     | Implemented |
| ------------- | ------------------------------- | ----------- |
| `/suggest`    | Make a suggestion               | ❌          |
| `/suggestion` | Configure the suggestion module | ❌          |

### Database structure

Suggestion:

```ts
export enum SuggestionState {
  Pending,
  Accepted,
  Denied
}

export type SuggestionDocument = {
  _id: Types.ObjectId; // Mongoose unique Id
  authorId: string; // Submitter
  guildId: string; // Guild
  channelId: string; // Suggestion channel
  messageId: string; // Message sent to the suggestion channel
  suggestion: string; // Text of the suggestion
  upvotes: string[]; // User Ids that upvoted the suggestion
  downvotes: string[]; // User Ids that downvotes the suggestion
  state: SuggestionState; // State of the suggestion
  reason?: string; // Optional reasoning after decline or accept
};
```

Module:

```ts
export type SuggestionConfigDocument = {
  _id: Types.ObjectId; // Mongoose unique Id
  guildId: string; // Guild this configuration is for
  enabled: boolean; // Whether module is enabled or not (default: false)
  channelId: string; // Suggestions will be send here
  staffRoleId: string; // Role that can accept or deny suggestions
};
```
