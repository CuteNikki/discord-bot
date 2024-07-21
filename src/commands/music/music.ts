import { lyricsExtractor, type LyricsData } from '@discord-player/extractor';
import { QueueRepeatMode, Track, useHistory, useMainPlayer, usePlayer, useQueue, useTimeline } from 'discord-player';
import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';
import { chunk, pagination } from 'utils/pagination';

export default new Command({
  module: ModuleType.Music,
  data: new SlashCommandBuilder()
    .setName('music')
    .setDescription('Start of all music commands')
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('play')
        .setDescription('Finds and plays your request')
        .addStringOption((option) => option.setName('query').setDescription('The track or playlist to play').setAutocomplete(true).setRequired(true))
    )
    .addSubcommand((subcommand) => subcommand.setName('stop').setDescription('Stops the player'))
    .addSubcommand((subcommand) => subcommand.setName('leave').setDescription('Disconnects the bot'))
    .addSubcommand((subcommand) => subcommand.setName('skip').setDescription('Skips to the next track'))
    .addSubcommand((subcommand) => subcommand.setName('back').setDescription('Goes back to the previous track'))
    .addSubcommand((subcommand) => subcommand.setName('resume').setDescription('Resumes the current track'))
    .addSubcommand((subcommand) => subcommand.setName('pause').setDescription('Pauses the current track'))
    .addSubcommand((subcommand) => subcommand.setName('nowplaying').setDescription('Shows the current track'))
    .addSubcommand((subcommand) => subcommand.setName('queue').setDescription('Shows the current queue'))
    .addSubcommand((subcommand) => subcommand.setName('history').setDescription('Shows the track history'))
    .addSubcommand((subcommand) => subcommand.setName('shuffle').setDescription('Shuffles the current queue'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('seek')
        .setDescription('Seeks to a specific point in a song')
        .addStringOption((option) => option.setName('timestamp').setDescription('The timestamp to seek to (example: 01:36)').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('volume')
        .setDescription('Get or change the current volume')
        .addIntegerOption((option) => option.setName('volume').setDescription('The volume to set').setMinValue(0).setMaxValue(100).setRequired(false))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('loop')
        .setDescription('Get or change the loop mode')
        .addIntegerOption((option) =>
          option
            .setName('mode')
            .setDescription('The loop mode to set')
            .addChoices(
              { name: 'Autoplay', value: QueueRepeatMode.AUTOPLAY },
              { name: 'Repeat Track', value: QueueRepeatMode.TRACK },
              { name: 'Repeat Queue', value: QueueRepeatMode.QUEUE },
              { name: 'Off', value: QueueRepeatMode.OFF }
            )
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) => subcommand.setName('remove-duplicates').setDescription('Removes all duplicated tracks from the queue'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove-track')
        .setDescription('Removes a track from the queue')
        .addIntegerOption((option) => option.setName('position').setDescription('The position of the track').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove-range')
        .setDescription('Removes a range of tracks from the queue')
        .addIntegerOption((option) => option.setName('start').setDescription('The position of the first track to remove').setMinValue(1).setRequired(true))
        .addIntegerOption((option) => option.setName('end').setDescription('The position of the last track to remove').setMinValue(1).setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove-user')
        .setDescription('Removes all tracks of a user from the queue')
        .addUserOption((option) => option.setName('user').setDescription('The user to remove tracks of').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('lyrics')
        .setDescription('Shows lyrics for a track')
        .addStringOption((option) => option.setName('query').setDescription('The song to get lyrics for').setAutocomplete(true).setRequired(false))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('bassboost')
        .setDescription('Toggle bass boost filter')
        .addBooleanOption((option) => option.setName('state').setDescription('Whether to enable or disable the filter').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('8d')
        .setDescription('Toggle the 8d filter')
        .addBooleanOption((option) => option.setName('state').setDescription('Whether to enable or disable the filter').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('vocalboost')
        .setDescription('Toggle vocal boost filter')
        .addBooleanOption((option) => option.setName('state').setDescription('Whether to enable or disable the filter').setRequired(true))
    ),
  async autocomplete({ interaction }) {
    const player = useMainPlayer();

    switch (interaction.options.getSubcommand()) {
      case 'play':
        {
          const query = interaction.options.getString('query', true);
          if (!query.length) return interaction.respond([]);

          try {
            const data = await player.search(query, { requestedBy: interaction.user });
            if (!data.hasTracks()) return interaction.respond([]);

            const results = data.tracks
              .filter((track) => track.url.length < 100)
              .slice(0, 25)
              .map((track) => ({ name: `${track.author} - ${track.title}`.slice(0, 100), value: track.url }));
            interaction.respond(results).catch(() => {});
          } catch (error) {
            interaction.respond([]).catch(() => {});
          }
        }
        break;
      case 'lyrics':
        {
          const query = interaction.options.getString('query', true);
          if (!query.length) return interaction.respond([]);

          const lyricsFinder = lyricsExtractor();

          try {
            const data = await lyricsFinder.search(query).catch(() => {});
            if (!data) return interaction.respond([]);

            interaction.respond([{ name: `${data.artist.name} - ${data.title}`.slice(0, 100), value: data.title.slice(0, 100) }].slice(0, 25)).catch(() => {});
          } catch (error) {
            interaction.respond([]).catch(() => {});
          }
        }
        break;
    }
  },
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { options, member, user, guildId } = interaction;
    await interaction.deferReply();

    const lng = await client.getUserLanguage(user.id);

    const player = useMainPlayer();

    switch (options.getSubcommand()) {
      case 'play':
        {
          const voiceChannel = member.voice.channel;
          if (!voiceChannel) return interaction.editReply(t('music.error.voice', { lng }));

          const query = options.getString('query', true);

          const result = await player.search(query, { requestedBy: user });

          if (!result.hasTracks()) return interaction.editReply(t('music.play.none', { lng }));

          try {
            const { track, searchResult } = await player.play(voiceChannel, result, {
              nodeOptions: {
                metadata: interaction,
                volume: 25,
                repeatMode: QueueRepeatMode.OFF,
                leaveOnStop: true,
                leaveOnStopCooldown: 60_000,
                leaveOnEmpty: true,
                leaveOnEmptyCooldown: 60_000,
                leaveOnEnd: true,
                leaveOnEndCooldown: 60_000,
                pauseOnEmpty: true,
              },
              requestedBy: user,
              connectionOptions: {
                deaf: true,
              },
            });

            interaction.editReply({
              embeds: [
                searchResult.hasPlaylist() && searchResult.playlist
                  ? new EmbedBuilder()
                      .setColor(Colors.Fuchsia)
                      .setThumbnail(searchResult.playlist.thumbnail)
                      .setTitle(t('music.play.title_playlist', { lng }))
                      .setURL(searchResult.playlist.url)
                      .addFields(
                        { name: t('music.play.author', { lng }), value: searchResult.playlist.author.name, inline: true },
                        { name: t('music.play.title', { lng }), value: searchResult.playlist.title, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: t('music.play.duration', { lng }), value: searchResult.playlist.durationFormatted, inline: true },
                        { name: t('music.play.tracks', { lng }), value: searchResult.playlist.tracks.length.toString(), inline: true },
                        { name: '\u200b', value: '\u200b', inline: true }
                      )
                      .setFooter({ text: t('music.play.queued_by', { lng, user: user.username }), iconURL: user.displayAvatarURL() })
                  : new EmbedBuilder()
                      .setColor(Colors.Fuchsia)
                      .setThumbnail(track.thumbnail)
                      .setTitle(t('music.play.title_track', { lng }))
                      .setURL(track.url)
                      .addFields(
                        { name: t('music.play.author', { lng }), value: track.author, inline: true },
                        { name: t('music.play.title', { lng }), value: track.title, inline: true },
                        { name: t('music.play.duration', { lng }), value: track.duration, inline: true }
                      )
                      .setFooter({ text: t('music.play.queued_by', { lng, user: user.username }), iconURL: user.displayAvatarURL() }),
              ],
            });
          } catch (error) {
            interaction.editReply(t('music.play.error', { lng }));
          }
        }
        break;
      case 'remove-track':
        {
          const position = options.getInteger('position', true) - 1;

          const queue = useQueue(guildId);
          if (!queue?.isPlaying()) return interaction.editReply(t('music.error.none', { lng }));

          if (position > queue.tracks.toArray().length) return interaction.editReply(t('music.remove.invalid', { lng }));
          const removedTrack = queue.node.remove(position);
          if (!removedTrack) return interaction.editReply(t('music.remove.failed', { lng }));

          interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.Fuchsia)
                .setTitle(t('music.remove.title_removed', { lng }))
                .setURL(removedTrack.url)
                .addFields(
                  { name: t('music.remove.author', { lng }), value: removedTrack.author, inline: true },
                  { name: t('music.remove.title', { lng }), value: removedTrack.title, inline: true },
                  { name: '\u200b', value: '\u200b', inline: true },
                  { name: t('music.remove.duration', { lng }), value: removedTrack.duration, inline: true },
                  { name: t('music.remove.queued_by', { lng }), value: `${removedTrack.requestedBy?.toString()}`, inline: true },
                  { name: '\u200b', value: '\u200b', inline: true }
                ),
            ],
          });
        }
        break;
      case 'remove-range':
        {
          const start = options.getInteger('start', true) - 1;
          const end = options.getInteger('end', true) - 1;

          const queue = useQueue(guildId);
          if (!queue?.isPlaying()) return interaction.editReply(t('music.error.none', { lng }));

          if (start > queue.tracks.toArray().length || end > queue.tracks.toArray().length || start > end)
            return interaction.editReply(t('music.remove.invalid', { lng }));

          const removedTracks: Track[] = [];
          for (let i = start; i <= end; i++) {
            const track = queue.node.remove(i);
            if (track) removedTracks.push(track);
          }
          if (!removedTracks.length) return interaction.editReply(t('music.remove.failed', { lng }));

          interaction.editReply(t('music.remove.range_success', { lng, tracks: removedTracks.length }));
        }
        break;
      case 'remove-user':
        {
          const target = options.getUser('user', true);

          const queue = useQueue(guildId);
          if (!queue?.isPlaying()) return interaction.editReply(t('music.error.none', { lng }));

          const removedTracks: Track[] = [];
          queue.tracks.toArray().forEach((track) => {
            if (track.requestedBy?.id === target.id) {
              const removedTrack = queue.node.remove(track);
              if (removedTrack) removedTracks.push(removedTrack);
            }
          });
          if (!removedTracks.length) return interaction.editReply(t('music.remove.failed', { lng }));

          interaction.editReply(t('music.remove.user_success', { lng, tracks: removedTracks.length, user: target.username }));
        }
        break;
      case 'remove-duplicates':
        {
          const queue = useQueue(guildId);
          if (!queue?.isPlaying()) return interaction.editReply(t('music.error.none', { lng }));

          const removedTracks: Track[] = [];
          const uniqueTracks = new Set<string>();
          queue.tracks.toArray().forEach((track) => {
            if (uniqueTracks.has(track.url)) {
              const removedTrack = queue.node.remove(track);
              if (removedTrack) removedTracks.push(removedTrack);
            } else {
              uniqueTracks.add(track.url);
            }
          });

          interaction.editReply(t('music.remove.duplicate_success', { lng, tracks: removedTracks.length }));
        }
        break;
      case 'stop':
        {
          const queue = useQueue(guildId);
          if (!queue?.isPlaying() || queue.deleted) return interaction.editReply(t('music.error.none', { lng }));

          queue.setRepeatMode(QueueRepeatMode.OFF);
          queue.node.stop();

          interaction.editReply(t('music.stop.success', { lng }));
        }
        break;
      case 'skip':
        {
          const queue = useQueue(guildId);
          if (!queue?.isPlaying()) return interaction.editReply(t('music.error.none', { lng }));

          queue.node.skip();

          interaction.editReply(t('music.skip.success', { lng }));
        }
        break;
      case 'back':
        {
          const history = useHistory(guildId);
          if (!history || history.isEmpty()) return interaction.editReply(t('music.back.none', { lng }));

          await history.back();

          interaction.editReply(t('music.back.success', { lng }));
        }
        break;
      case 'resume':
        {
          const timeline = useTimeline(guildId);
          if (!timeline?.track) return interaction.editReply(t('music.error.none', { lng }));
          if (!timeline.paused) return interaction.editReply(t('music.resume.already', { lng }));

          timeline.resume();
          interaction.editReply(t('music.resume.success', { lng }));
        }
        break;
      case 'pause':
        {
          const timeline = useTimeline(guildId);
          if (!timeline?.track) return interaction.editReply(t('music.error.none', { lng }));
          if (timeline.paused) return interaction.editReply(t('music.pause.already', { lng }));

          timeline.pause();
          interaction.editReply(t('music.pause.success', { lng }));
        }
        break;
      case 'volume':
        {
          const timeline = useTimeline(guildId);
          if (!timeline?.track) return interaction.editReply(t('music.error.none', { lng }));

          const volume = options.getInteger('volume', false);
          if (!volume) return interaction.editReply(t('music.volume.current', { lng, volume: timeline.volume }));

          timeline.setVolume(volume);
          interaction.editReply(t('music.volume.changed', { lng, volume }));
        }
        break;
      case 'seek':
        {
          const queue = useQueue(guildId);
          if (!queue?.isPlaying() || !queue.currentTrack) return interaction.editReply(t('music.error.none', { lng }));

          const timestampInputSplit: string[] = options.getString('timestamp', true).split(':');
          const formattedTimestamp: string = parseTimestampArray(timestampInputSplit);

          if (!validateTimestampFormat(formattedTimestamp)) return interaction.editReply(t('music.seek.invalid', { lng }));

          const maxDuration = queue.currentTrack.durationMS;
          const inputDuration = getDuration(timestampInputSplit);

          if (inputDuration > maxDuration - 1000) return interaction.editReply(t('music.seek.invalid', { lng }));

          await queue.node.seek(inputDuration);
          interaction.editReply(t('music.seek.success', { lng, timestamp: formattedTimestamp }));
        }
        break;
      case 'nowplaying':
        {
          const node = usePlayer(guildId);
          const timeline = useTimeline(guildId);
          if (!timeline?.track || !node) return interaction.editReply(t('music.error.none', { lng }));

          const { track, timestamp } = timeline;

          interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.Fuchsia)
                .setThumbnail(track.thumbnail)
                .setTitle(t('music.nowplaying.title_now', { lng }))
                .setURL(track.url)
                .addFields(
                  { name: t('music.nowplaying.author', { lng }), value: track.author, inline: true },
                  { name: t('music.nowplaying.title', { lng }), value: track.title, inline: true },
                  { name: t('music.nowplaying.duration', { lng }), value: track.duration, inline: true },
                  { name: t('music.nowplaying.progress', { lng, progress: timestamp.progress }), value: `${node.createProgressBar()}`, inline: false }
                )
                .setFooter({ text: t('music.nowplaying.requested_by', { lng, user: track.requestedBy?.username }), iconURL: user.displayAvatarURL() }),
            ],
          });
        }
        break;
      case 'queue':
        {
          const queue = useQueue(guildId);
          if (!queue?.isPlaying()) return interaction.editReply(t('music.error.none', { lng }));
          if (!queue.tracks.toArray().length) return interaction.editReply(t('music.queue.none', { lng }));

          const tracks = queue.tracks.toArray();
          const chunkedTracks = chunk(tracks, 10);
          await pagination({
            client,
            interaction,
            embeds: chunkedTracks.map((tracks, pageIndex) =>
              new EmbedBuilder()
                .setColor(Colors.Fuchsia)
                .setTitle(t('music.queue.title', { lng, page: pageIndex + 1, pages: chunkedTracks.length }))
                .setDescription(
                  tracks
                    .map(
                      (track, trackIndex) => `${trackIndex + 1 + pageIndex * 10}. ${track.author} - ${track.title} \`${track.duration}\` (${track.requestedBy})`
                    )
                    .join('\n')
                )
            ),
          });
        }
        break;
      case 'history':
        {
          const history = useHistory(guildId);
          if (!history?.tracks) return interaction.editReply(t('music.history.none', { lng }));

          const tracks = history.tracks.toArray();
          const chunkedTracks = chunk(tracks, 10);
          await pagination({
            client,
            interaction,
            embeds: chunkedTracks.map((tracks, pageIndex) =>
              new EmbedBuilder()
                .setColor(Colors.Fuchsia)
                .setTitle(t('music.history.title', { lng, page: pageIndex + 1, pages: chunkedTracks.length }))
                .setDescription(
                  tracks
                    .map(
                      (track, trackIndex) => `${trackIndex + 1 + pageIndex * 10}. ${track.author} - ${track.title} \`${track.duration}\` (${track.requestedBy})`
                    )
                    .join('\n')
                )
            ),
          });
        }
        break;
      case 'shuffle':
        {
          const queue = useQueue(guildId);
          if (!queue?.isPlaying()) return interaction.editReply(t('music.error.none', { lng }));

          queue.tracks.shuffle();
          interaction.editReply(t('music.shuffle.success', { lng }));
        }
        break;
      case 'loop':
        {
          const queue = useQueue(guildId);
          if (!queue?.isPlaying()) return interaction.editReply(t('music.error.none', { lng }));

          const mode = options.getInteger('mode', false);
          if (mode) {
            queue.setRepeatMode(mode);
            interaction.editReply(t('music.loop.set', { lng, mode: QueueRepeatMode[mode] }));
          } else {
            interaction.editReply(t('music.loop.current', { lng, mode: QueueRepeatMode[queue.repeatMode] }));
          }
        }
        break;
      case 'leave':
        {
          const queue = useQueue(guildId);
          if (!queue) return interaction.editReply(t('music.leave.queue', { lng }));

          queue.delete();
          interaction.editReply(t('music.leave.success', { lng }));
        }
        break;
      case 'lyrics':
        {
          const query = options.getString('query', false);

          let lyrics: LyricsData | null | void;
          const lyricsFinder = lyricsExtractor();

          if (!query) {
            const timeline = useTimeline(guildId);
            if (!timeline?.track) return interaction.editReply(t('music.error.none', { lng }));

            lyrics = await lyricsFinder.search(`${timeline.track.author} ${timeline.track.title}`).catch(() => {});
          } else {
            lyrics = await lyricsFinder.search(query).catch(() => {});
          }

          if (!lyrics) return interaction.editReply(t('music.lyrics.none', { lng }));

          const trimmedLyrics = lyrics.lyrics.substring(0, 4000);
          interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.Fuchsia)
                .setThumbnail(lyrics.thumbnail)
                .setTitle(lyrics.title)
                .setURL(lyrics.url)
                .setAuthor({ name: lyrics.artist.name, iconURL: lyrics.artist.image, url: lyrics.artist.url })
                .setDescription(trimmedLyrics.length === 4000 ? `${trimmedLyrics}...` : trimmedLyrics),
            ],
          });
        }
        break;
      case 'bassboost':
        {
          const state = options.getBoolean('state', true);

          const queue = useQueue(guildId);

          if (!queue?.isPlaying()) return interaction.editReply(t('music.error.none', { lng }));
          if (!queue.filters.equalizer) return interaction.editReply(t('music.error.equalizer', { lng }));

          if (state) {
            queue.filters.equalizer.setEQ(queue.filters.equalizerPresets.FullBass);
            interaction.editReply(t('music.bassboost.enabled', { lng }));
          } else {
            queue.filters.equalizer.setEQ(queue.filters.equalizerPresets.Flat);
            interaction.editReply(t('music.bassboost.disabled', { lng }));
          }
        }
        break;
      case '8d':
        {
          const state = options.getBoolean('state', true);

          const queue = useQueue(guildId);

          if (!queue?.isPlaying()) return interaction.editReply(t('music.error.none', { lng }));
          if (!queue.filters.filters) return interaction.editReply(t('music.error.filters', { lng }));

          if (state) {
            queue.filters.filters.setFilters(['8D']);
            interaction.editReply(t('music.8d.enabled', { lng }));
          } else {
            queue.filters.filters.setFilters([]);
            interaction.editReply(t('music.8d.disabled', { lng }));
          }
        }
        break;
      case 'vocalboost':
        {
          const state = options.getBoolean('state', true);

          const queue = useQueue(guildId);

          if (!queue?.isPlaying()) return interaction.editReply(t('music.error.none', { lng }));
          if (!queue.filters.equalizer) return interaction.editReply(t('music.error.equalizer', { lng }));

          if (state) {
            queue.filters.equalizer.setEQ([
              { band: 0, gain: -0.2 },
              { band: 1, gain: -0.2 },
              { band: 2, gain: 0.2 },
              { band: 3, gain: 0.15 },
              { band: 4, gain: 0.1 },
              { band: 5, gain: -0.1 },
            ]);
            interaction.editReply(t('music.vocalboost.enabled', { lng }));
          } else {
            queue.filters.equalizer.setEQ(queue.filters.equalizerPresets.Flat);
            interaction.editReply(t('music.vocalboost.disabled', { lng }));
          }
        }
        break;
    }
  },
});

function parseTimestampArray(timestampInputSplit: string[]): string {
  switch (timestampInputSplit.length) {
    case 1:
      timestampInputSplit.unshift('00', '00');
      break;
    case 2:
      timestampInputSplit.unshift('00');
      break;
    default:
      break;
  }

  timestampInputSplit = timestampInputSplit.map((value) => value.padStart(2, '0'));
  return timestampInputSplit.join(':');
}
function validateTimestampFormat(formattedTimestamp: string) {
  const formattedDurationSplit: string[] = formattedTimestamp.split(':');

  if (formattedDurationSplit.length === 0 || formattedDurationSplit.length > 3) return false;
  if (!formattedDurationSplit.every((value) => value.length === 2)) return false;

  const regex: RegExp = new RegExp('([0-1][0-9]|2[0-3]):?[0-5][0-9]:?[0-5][0-9]');
  const isValidDuration: boolean = regex.test(formattedTimestamp);
  return isValidDuration;
}

function getDuration(timestampInputSplit: string[]) {
  const durationInMilliseconds = Number(timestampInputSplit[0]) * 3_600_000 + Number(timestampInputSplit[1]) * 60_000 + Number(timestampInputSplit[2]) * 1_000;
  return durationInMilliseconds;
}
