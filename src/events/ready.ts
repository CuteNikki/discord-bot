import { ActivityType, Events, PresenceUpdateStatus, type PresenceStatusData } from 'discord.js';

import { Event } from 'classes/event';

import logger from 'utility/logger';

export default new Event({
  name: Events.ClientReady,
  once: true,
  async execute(extendedClient, readyClient) {
    // Fetching and setting custom emojis
    await readyClient.application.emojis.fetch();

    for (const emoji of readyClient.application.emojis.cache.values()) {
      extendedClient.customEmojis[emoji.name as keyof typeof extendedClient.customEmojis] = emoji;
    }

    const presences: { status: PresenceStatusData; name: string; type: ActivityType; url?: string }[] = [
      {
        status: PresenceUpdateStatus.Online,
        name: `${readyClient.guilds.cache.size} servers`,
        type: ActivityType.Watching,
      },
      {
        status: PresenceUpdateStatus.Online,
        name: 'your messages',
        type: ActivityType.Listening,
      },
      {
        status: PresenceUpdateStatus.DoNotDisturb,
        name: 'the bot wars!',
        type: ActivityType.Competing,
      },
      {
        status: PresenceUpdateStatus.Idle,
        name: 'my creators',
        type: ActivityType.Listening,
      },
    ];
    // Set the initial presence
    readyClient.user.setPresence({
      status: PresenceUpdateStatus.DoNotDisturb,
      activities: [
        {
          name: 'Loading...',
          type: ActivityType.Custom,
        },
      ],
    });

    let lastPresence = 0;

    setInterval(() => {
      const presence = presences[Math.floor(Math.random() * presences.length)];

      // Avoid setting the same presence twice in a row
      if (lastPresence === presences.indexOf(presence)) {
        return; // @todo: instead of returning, we should set the next presence
      }
      lastPresence = presences.indexOf(presence);

      // Set the presence
      readyClient.user.setPresence({
        status: presence.status,
        activities: [
          {
            name: presence.name,
            type: presence.type,
          },
        ],
      });
    }, 60_000);

    logger.info(`Logged in as ${readyClient.user.tag}`);
  },
});
