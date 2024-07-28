import { codeBlock, Colors, EmbedBuilder, Events, WebhookClient } from 'discord.js';
import mongoose from 'mongoose';

import type { DiscordClient } from 'classes/client';

import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

const webhookUrl = keys.DEVELOPER_ERROR_WEBHOOK;

export async function sendError({
  client,
  location,
  error,
  reason,
  promise,
  url,
}: {
  client: DiscordClient;
  location: string;
  reason?: string;
  error?: Error;
  promise?: Promise<any>;
  url?: string;
}) {
  logger.error({ location, error, reason, promise }, `[${client.cluster.id}] An error occurred`);

  if (!webhookUrl) return;
  const webhook = new WebhookClient({ url: webhookUrl });
  const embed = new EmbedBuilder().setColor(Colors.Red);

  if (error)
    embed
      .setTitle('An error occurred')
      .setURL(url ?? null)
      .setDescription(
        codeBlock('ts', `Stack: ${error.stack ? (error.stack.length > 3500 ? error.stack.slice(0, 3500) + '...' : error.stack) : 'not available'}`)
      )
      .addFields(
        { name: 'Name', value: `\`${error.name}\`` },
        { name: 'Message', value: `\`${error.message}\`` },
        { name: 'Location', value: `\`${location}\`` },
        { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
      );
  if (reason)
    embed
      .setDescription(`Reason: ${reason}`)
      .addFields({ name: 'Location', value: location }, { name: 'Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:F>` });

  await webhook
    .send({
      username: `${client.user?.username} | Error` ?? 'Error Notification',
      avatarURL: client.user?.displayAvatarURL(),
      embeds: [embed],
    })
    .catch((error) => logger.error(error, 'Could not send error to webhook'));
}

export async function listenToErrors(client: DiscordClient) {
  client.on(Events.Error, (error) =>
    sendError({ client, error, location: 'DiscordJS Client Error', url: 'https://discordjs.guide/popular-topics/errors.html#api-errors' })
  );
  client.on(Events.ShardError, (error) =>
    sendError({ client, error, location: 'DiscordJS Shard Error', url: 'https://discordjs.guide/popular-topics/errors.html#api-errors' })
  );
  process.on('uncaughtException', (error) =>
    sendError({ client, error, location: 'NodeJS Uncaught Exception', url: 'https://nodejs.org/api/process.html#event-uncaughtexception' })
  );
  process.on('uncaughtExceptionMonitor', (error) =>
    sendError({ client, error, location: 'NodeJS Uncaught Exception Monitor', url: 'https://nodejs.org/api/process.html#event-uncaughtexceptionmonitor' })
  );
  process.on('unhandledRejection', (reason: any, promise) =>
    sendError({ client, reason, promise, location: 'NodeJS Unhandled Rejection', url: 'https://nodejs.org/api/process.html#event-unhandledrejection' })
  );
  process.on('warning', (error) => sendError({ client, error, location: 'NodeJS Warning', url: 'https://nodejs.org/api/process.html#event-warning' }));
  mongoose.connection.on('error', (error) =>
    sendError({ client, error, location: 'Mongoose Connection Error', url: 'https://mongoosejs.com/docs/api/error.html' })
  );
}
