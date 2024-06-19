import type { DiscordClient } from 'classes/client';
import { Colors, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

import { logger } from 'utils/logger';

export async function managePlayer(client: DiscordClient) {
  const player = client.player;

  // await player.extractors.loadDefault((extractor) => extractor === 'SoundCloudExtractor');
  await player.extractors.loadDefault((extractor) => extractor !== 'YouTubeExtractor'); // YouTube currently doesn't seem to work

  player.events.on('playerError', (_queue, error: any, track) => {
    logger.error({ error, track }, 'DiscordPlayer Error');
  });

  player.events.on('playerStart', async (queue, track) => {
    const lng = await client.getLanguage(track.requestedBy?.id);

    queue.metadata.channel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Fuchsia)
            .setThumbnail(track.thumbnail)
            .setTitle(i18next.t('music.nowplaying.title_now', { lng }))
            .setURL(track.url)
            .addFields(
              { name: i18next.t('music.nowplaying.author', { lng }), value: track.author, inline: true },
              { name: i18next.t('music.nowplaying.title', { lng }), value: track.title, inline: true },
              { name: i18next.t('music.nowplaying.duration', { lng }), value: track.duration, inline: true }
            )
            .setFooter({
              text: i18next.t('music.nowplaying.requested_by', { lng, user: track.requestedBy?.username }),
              iconURL: track.requestedBy?.displayAvatarURL(),
            }),
        ],
      })
      .catch(() => {});
  });
  player.events.on('emptyQueue', async (queue) => {
    const lng = await client.getLanguage(queue.history.tracks.toArray()[queue.history.tracks.toArray().length - 1].requestedBy?.id);

    queue.metadata.channel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Fuchsia)
            .setTitle(i18next.t('music.empty_queue.title', { lng }))
            .setDescription(i18next.t('music.empty_queue.description', { lng })),
        ],
      })
      .catch(() => {});
  });
  player.events.on('emptyChannel', async (queue) => {
    const lng = await client.getLanguage(queue.history.tracks.toArray()[queue.history.tracks.toArray().length - 1].requestedBy?.id);

    queue.metadata.channel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Fuchsia)
            .setTitle(i18next.t('music.empty_voice_channel.title', { lng }))
            .setDescription(i18next.t('music.empty_voice_channel.description', { lng })),
        ],
      })
      .catch(() => {});
  });
}
