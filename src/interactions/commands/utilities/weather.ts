import dayjs from 'dayjs';
import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { COMPASS, UK_DEFRA_INDEX, US_EPA_INDEX, UV_INDEX } from 'constants/weather';
import { getCurrentWeather, getHistoricWeather, getWeatherForecast } from 'utils/weather';

export default new Command({
  module: ModuleType.Utilities,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Get weather information')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('current')
        .setDescription('Get the current weather')
        .addStringOption((option) => option.setName('location').setDescription('The location to get weather information for').setRequired(true))
        .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to false will show the message to everyone').setRequired(false)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('forecast')
        .setDescription('Get the weather forecast')
        .addStringOption((option) => option.setName('location').setDescription('The location to get weather information for').setRequired(true))
        .addStringOption((option) =>
          option
            .setName('days')
            .setDescription('How many days of forecast to show')
            .setRequired(false)
            .setChoices([
              { name: '1 day', value: '1' },
              { name: '2 days', value: '2' },
              { name: '3 day', value: '3' },
            ]),
        )
        .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to true it will only shows the message to you').setRequired(false)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('history')
        .setDescription('Get the weather history')
        .addStringOption((option) => option.setName('location').setDescription('The location to get weather information for').setRequired(true))
        .addStringOption((option) => option.setName('date').setDescription('The date to get weather information for').setRequired(true))
        .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to true it will only shows the message to you').setRequired(false)),
    ),
  async execute({ interaction, client, lng }) {
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const { options, user } = interaction;

    const userLocation = options.getString('location', true);
    const days = options.getString('days', false) ?? '1';

    switch (options.getSubcommand()) {
      case 'current':
        {
          const weather = await getCurrentWeather(userLocation);

          if (!weather) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('weather.none', { lng }))] });
            return;
          }

          const { current, location } = weather;

          const currentEmbed = new EmbedBuilder()
            .setColor(client.colors.utilities)
            .setTitle(t('weather.current.embed_title', { lng }))
            .addFields(
              {
                name: t('weather.location.title', { lng }),
                value: [
                  t('weather.location.name', { lng, name: location.name }),
                  t('weather.location.region', {
                    lng,
                    region: location.region,
                  }),
                  t('weather.location.country', {
                    lng,
                    country: location.country,
                  }),
                  t('weather.location.coordinates', {
                    lng,
                    latitude: location.lat,
                    longitude: location.lon,
                  }),
                  t('weather.location.localtime', {
                    lng,
                    localtime: location.localtime,
                  }),
                  t('weather.location.timezone', {
                    lng,
                    timezone: location.tz_id,
                  }),
                ].join('\n'),
              },
              {
                name: t('weather.current.title', { lng }),
                value: [
                  t('weather.current.condition', {
                    lng,
                    condition: current.condition.text,
                  }),
                  t('weather.current.humidity', {
                    lng,
                    humidity: current.humidity,
                  }),
                  t('weather.current.cloud', { lng, coverage: current.cloud }),
                  t('weather.current.temperature', {
                    lng,
                    temp_c: current.temp_c,
                    temp_f: current.temp_f,
                  }),
                  t('weather.current.feels_like', {
                    lng,
                    temp_c: current.feelslike_c,
                    temp_f: current.feelslike_f,
                  }),
                  t('weather.current.uv_index', { lng, uv: UV_INDEX[current.uv] }),
                  t('weather.current.wind_direction', {
                    lng,
                    direction: COMPASS[current.wind_dir],
                    degree: current.wind_degree,
                  }),
                  t('weather.current.wind_speed', {
                    lng,
                    speed_kph: current.wind_kph,
                    speed_mph: current.wind_mph,
                  }),
                  t('weather.current.wind_gust', {
                    lng,
                    gust_kph: current.gust_kph,
                    gust_mph: current.gust_mph,
                  }),
                  t('weather.current.pressure', {
                    lng,
                    pressure_mb: current.pressure_mb,
                    pressure_in: current.pressure_in,
                  }),
                  t('weather.current.precipitation', {
                    lng,
                    precipitation_mm: current.precip_mm,
                    precipitation_in: current.precip_in,
                  }),
                  t('weather.current.visibility', {
                    lng,
                    vis_km: current.vis_km,
                    vis_miles: current.vis_miles,
                  }),
                  t('weather.current.last_updated', {
                    lng,
                    updated: current.last_updated,
                  }),
                ].join('\n'),
              },
              {
                name: t('weather.quality.title', { lng }),
                value: [
                  t('weather.quality.co', {
                    lng,
                    co: (Math.round(current.air_quality.co + Number.EPSILON) * 100) / 100,
                  }),
                  t('weather.quality.o3', {
                    lng,
                    o3: (Math.round(current.air_quality.o3 + Number.EPSILON) * 100) / 100,
                  }),
                  t('weather.quality.no2', {
                    lng,
                    no2: (Math.round(current.air_quality.no2 + Number.EPSILON) * 100) / 100,
                  }),
                  t('weather.quality.so2', {
                    lng,
                    so2: (Math.round(current.air_quality.so2 + Number.EPSILON) * 100) / 100,
                  }),
                  t('weather.quality.pm2_5', {
                    lng,
                    pm2_5: (Math.round(current.air_quality.pm2_5 + Number.EPSILON) * 100) / 100,
                  }),
                  t('weather.quality.pm10', {
                    lng,
                    pm10: (Math.round(current.air_quality.pm10 + Number.EPSILON) * 100) / 100,
                  }),
                  t('weather.quality.epa_index', {
                    lng,
                    index: US_EPA_INDEX[current.air_quality['us-epa-index']],
                  }),
                  t('weather.quality.defra_index', {
                    lng,
                    index: UK_DEFRA_INDEX[current.air_quality['gb-defra-index']],
                  }),
                ].join('\n'),
              },
            );
          if (current.condition.icon) {
            currentEmbed.setThumbnail(`https:${current.condition.icon}`);
          }

          await interaction.editReply({ embeds: [currentEmbed] });
        }
        break;
      case 'forecast':
        {
          const forecast = await getWeatherForecast(userLocation, days);

          if (!forecast) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('weather.none', { lng }))] });
            return;
          }

          const { location } = forecast;

          const embeds: EmbedBuilder[] = [
            new EmbedBuilder()
              .setColor(client.colors.utilities)
              .setTitle(t('weather.location.title', { lng }))
              .setDescription(
                [
                  t('weather.location.name', {
                    lng,
                    name: location.name,
                  }),
                  t('weather.location.region', {
                    lng,
                    region: location.region,
                  }),
                  t('weather.location.country', {
                    lng,
                    country: location.country,
                  }),
                  t('weather.location.coordinates', {
                    lng,
                    latitude: location.lat,
                    longitude: location.lon,
                  }),
                  t('weather.location.localtime', {
                    lng,
                    localtime: location.localtime,
                  }),
                  t('weather.location.timezone', {
                    lng,
                    timezone: location.tz_id,
                  }),
                ].join('\n'),
              ),
          ];

          for (const forecastday of forecast.forecast.forecastday) {
            const { day, astro } = forecastday;

            const forecastEmbed = new EmbedBuilder()
              .setColor(client.colors.utilities)
              .setTitle(t('weather.forecast.title', { lng, date: forecastday.date }))
              .setDescription(
                [
                  t('weather.forecast.condition', {
                    lng,
                    condition: day.condition.text,
                  }),
                  t('weather.forecast.avg_humidity', {
                    lng,
                    humidity: day.avghumidity,
                  }),
                  t('weather.forecast.rain_chance', {
                    lng,
                    chance: day.daily_chance_of_rain,
                  }),
                  t('weather.forecast.snow_chance', {
                    lng,
                    chance: day.daily_chance_of_snow,
                  }),
                  t('weather.forecast.max_temp', {
                    lng,
                    temp_c: day.maxtemp_c,
                    temp_f: day.maxtemp_f,
                  }),
                  t('weather.forecast.min_temp', {
                    lng,
                    temp_c: day.mintemp_c,
                    temp_f: day.mintemp_f,
                  }),
                  t('weather.forecast.avg_temp', {
                    lng,
                    temp_c: day.avgtemp_c,
                    temp_f: day.avgtemp_f,
                  }),
                  t('weather.forecast.uv_index', { lng, uv: UV_INDEX[day.uv] }),
                  t('weather.forecast.max_wind_speed', {
                    lng,
                    speed_kph: day.maxwind_kph,
                    speed_mph: day.maxwind_mph,
                  }),
                  t('weather.forecast.total_precipitation', {
                    lng,
                    precipitation_mm: day.totalprecip_mm,
                    precipitation_in: day.totalprecip_in,
                  }),
                  t('weather.forecast.total_snowfall', {
                    lng,
                    snowfall: day.totalsnow_cm,
                  }),
                  t('weather.forecast.avg_visibility', {
                    lng,
                    vis_km: day.avgvis_km,
                    vis_miles: day.avgvis_miles,
                  }),
                ].join('\n'),
              )
              .addFields({
                name: t('weather.astro.title', { lng }),
                value: [
                  t('weather.astro.sunrise', { lng, sunrise: astro.sunrise }),
                  t('weather.astro.sunset', { lng, sunset: astro.sunset }),
                  t('weather.astro.moonset', { lng, moonset: astro.moonset }),
                  t('weather.astro.moon_phase', { lng, phase: astro.moon_phase }),
                  t('weather.astro.moon_illumination', {
                    lng,
                    illumination: astro.moon_illumination,
                  }),
                ].join('\n'),
              });

            if (day.condition.icon) {
              forecastEmbed.setThumbnail(`https:${day.condition.icon}`);
            }

            embeds.push(forecastEmbed);
          }

          await interaction.editReply({ embeds });
        }
        break;
      case 'history':
        {
          const date = dayjs(options.getString('date', true));

          if (!date.isValid()) {
            const currentDate = new Date();

            await interaction.editReply({
              content: t('weather.history.date', {
                lng,
                formats: [
                  '',
                  `\`YYYY-MM-DD\` - ${dayjs(currentDate).format('YYYY-MM-DD')}`,
                  `\`YYYY/MM/DD\` - ${dayjs(currentDate).format('YYYY/MM/DD')}`,
                  `\`YYYY.MM.DD\` - ${dayjs(currentDate).format('YYYY.MM.DD')}`,
                  `\`YYYY MM DD\` - ${dayjs(currentDate).format('YYYY MM DD')}`,
                  `\`MM-DD-YYYY\` - ${dayjs(currentDate).format('MM-DD-YYYY')}`,
                  `\`MM/DD/YYYY\` - ${dayjs(currentDate).format('MM/DD/YYYY')}`,
                  `\`MM.DD.YYYY\` - ${dayjs(currentDate).format('MM.DD.YYYY')}`,
                  `\`MM DD YYYY\` - ${dayjs(currentDate).format('MM DD YYYY')}`,
                ].join('\n'),
              }),
            });
            return;
          }

          const historic = await getHistoricWeather(userLocation, date.format('YYYY-MM-DD'));

          if (!historic) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('weather.none', { lng }))] });
            return;
          }

          const { location, forecast } = historic;
          const { astro, day, date: forecastDate } = forecast.forecastday[0];

          const embed = new EmbedBuilder()
            .setColor(client.colors.utilities)
            .setTitle(t('weather.history.embed_title', { lng, date: forecastDate }))
            .addFields(
              {
                name: t('weather.location.title', { lng }),
                value: [
                  t('weather.location.name', {
                    lng,
                    name: location.name,
                  }),
                  t('weather.location.region', {
                    lng,
                    region: location.region,
                  }),
                  t('weather.location.country', {
                    lng,
                    country: location.country,
                  }),
                  t('weather.location.coordinates', {
                    lng,
                    latitude: location.lat,
                    longitude: location.lon,
                  }),
                  t('weather.location.localtime', {
                    lng,
                    localtime: location.localtime,
                  }),
                  t('weather.location.timezone', {
                    lng,
                    timezone: location.tz_id,
                  }),
                ].join('\n'),
              },
              {
                name: t('weather.history.title', { lng }),
                value: [
                  t('weather.history.condition', {
                    lng,
                    condition: day.condition.text,
                  }),
                  t('weather.history.avg_humidity', {
                    lng,
                    humidity: day.avghumidity,
                  }),
                  t('weather.history.rain_chance', {
                    lng,
                    chance: day.daily_chance_of_rain,
                  }),
                  t('weather.history.snow_chance', {
                    lng,
                    chance: day.daily_chance_of_snow,
                  }),
                  t('weather.history.max_temp', {
                    lng,
                    temp_c: day.maxtemp_c,
                    temp_f: day.maxtemp_f,
                  }),
                  t('weather.history.min_temp', {
                    lng,
                    temp_c: day.mintemp_c,
                    temp_f: day.mintemp_f,
                  }),
                  t('weather.history.avg_temp', {
                    lng,
                    temp_c: day.avgtemp_c,
                    temp_f: day.avgtemp_f,
                  }),
                  t('weather.history.uv_index', { lng, uv: UV_INDEX[day.uv] }),
                  t('weather.history.max_wind_speed', {
                    lng,
                    speed_kph: day.maxwind_kph,
                    speed_mph: day.maxwind_mph,
                  }),
                  t('weather.history.total_precipitation', {
                    lng,
                    precipitation_mm: day.totalprecip_mm,
                    precipitation_in: day.totalprecip_in,
                  }),
                  t('weather.history.total_snowfall', {
                    lng,
                    snowfall: day.totalsnow_cm,
                  }),
                  t('weather.history.avg_visibility', {
                    lng,
                    vis_km: day.avgvis_km,
                    vis_miles: day.avgvis_miles,
                  }),
                ].join('\n'),
              },
              {
                name: t('weather.astro.title', { lng }),
                value: [
                  t('weather.astro.sunrise', { lng, sunrise: astro.sunrise }),
                  t('weather.astro.sunset', { lng, sunset: astro.sunset }),
                  t('weather.astro.moonset', { lng, moonset: astro.moonset }),
                  t('weather.astro.moon_phase', { lng, phase: astro.moon_phase }),
                  t('weather.astro.moon_illumination', {
                    lng,
                    illumination: astro.moon_illumination,
                  }),
                ].join('\n'),
              },
            );

          if (day.condition.icon) {
            embed.setThumbnail(`https:${day.condition.icon}`);
          }

          await interaction.editReply({ embeds: [embed] });
        }
        break;
    }
  },
});
