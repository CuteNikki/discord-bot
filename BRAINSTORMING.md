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
