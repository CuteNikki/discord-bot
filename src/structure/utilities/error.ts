import { codeBlock, Colors, EmbedBuilder, Events, WebhookClient } from 'discord.js';
import mongoose from 'mongoose';

import type { DiscordClient } from 'classes/client';

import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

const webhookUrl = keys.DEVELOPER_ERROR_WEBHOOK;

export async function sendError({ client, location, error, reason }: { client: DiscordClient; location: string; reason?: string; error?: Error }) {
  logger.error({ error, reason, location }, `[${client.cluster.id}] An error occurred`);

  if (!webhookUrl) return;
  const webhook = new WebhookClient({ url: webhookUrl });
  const embed = new EmbedBuilder().setColor(Colors.Red);

  if (error)
    embed
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
  client.on(Events.Error, (error) => sendError({ client, error, location: 'DiscordJS Client Error' }));
  client.on(Events.ShardError, (error) => sendError({ client, error, location: 'DiscordJS Shard Error' }));
  process.on('unhandledRejection', (reason: any) => sendError({ client, reason, location: 'NodeJS Unhandled Rejection' }));
  process.on('uncaughtException', (error) => sendError({ client, error, location: 'NodeJS Uncaught Exception' }));
  process.on('uncaughtExceptionMonitor', (error) => sendError({ client, error, location: 'NodeJS Uncaught Exception Monitor' }));
  process.on('warning', (error) => sendError({ client, error, location: 'NodeJS Warning' }));
  mongoose.connection.on('error', (error) => sendError({ client, error, location: 'Mongoose Connection Error' }));
}
