import dayjs from 'dayjs';
import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';
import { compass, defraIndex, epaIndex, getCurrentWeather, getHistoricWeather, getWeatherForecast, uvIndex } from 'utils/weather';

export default new Command({
  module: Modules.UTILITIES,
  data: {
    name: 'weather',
    description: 'Get weather information',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD, Contexts.BOT_DM, Contexts.PRIVATE_CHANNEL],
    integration_types: [IntegrationTypes.GUILD_INSTALL, IntegrationTypes.USER_INSTALL],
    options: [
      {
        name: 'current',
        description: 'Get the current weather',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'location',
            description: 'The location to get weather information for',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: 'ephemeral',
            description: 'When set to false will show the message to everyone',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
          },
        ],
      },
      {
        name: 'forecast',
        description: 'Get the weather forecast',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'location',
            description: 'The location to get weather information for',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: 'days',
            description: 'How many days of forecast to show',
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
              { name: '1 day', value: '1' },
              { name: '2 days', value: '2' },
              { name: '3 days', value: '3' },
            ],
          },
          {
            name: 'ephemeral',
            description: 'When set to true it will only shows the message to you',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
          },
        ],
      },
      {
        name: 'history',
        description: 'Get the weather history',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'location',
            description: 'The location to get weather information for',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: 'date',
            description: 'The date to get weather information for',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: 'ephemeral',
            description: 'When set to true it will only shows the message to you',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
          },
        ],
      },
    ],
  },
  async execute({ interaction, client }) {
    const { options, user } = interaction;
    const ephemeral = options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });
    const lng = await client.getUserLanguage(user.id);

    const userLocation = options.getString('location', true);
    const days = options.getString('days', false) ?? '1';

    switch (options.getSubcommand()) {
      case 'current':
        const currentWeather = await getCurrentWeather(userLocation);
        if (!currentWeather) return interaction.editReply({ content: i18next.t('weather.none', { lng }) });
        const { current, location: currentLocation } = currentWeather;

        const currentEmbed = new EmbedBuilder()
          .setColor(Colors.Aqua)
          .setTitle(i18next.t('weather.current.embed_title', { lng }))
          .addFields(
            {
              name: i18next.t('weather.location.title', { lng }),
              value: [
                i18next.t('weather.location.name', { lng, name: currentLocation.name }),
                i18next.t('weather.location.region', { lng, region: currentLocation.region }),
                i18next.t('weather.location.country', { lng, country: currentLocation.country }),
                i18next.t('weather.location.coordinates', { lng, latitude: currentLocation.lat, longitude: currentLocation.lon }),
                i18next.t('weather.location.localtime', { lng, localtime: currentLocation.localtime }),
                i18next.t('weather.location.timezone', { lng, timezone: currentLocation.tz_id }),
              ].join('\n'),
            },
            {
              name: i18next.t('weather.current.title', { lng }),
              value: [
                i18next.t('weather.current.condition', { lng, condition: current.condition.text }),
                i18next.t('weather.current.humidity', { lng, humidity: current.humidity }),
                i18next.t('weather.current.cloud', { lng, coverage: current.cloud }),
                i18next.t('weather.current.temperature', { lng, temp_c: current.temp_c, temp_f: current.temp_f }),
                i18next.t('weather.current.feels_like', { lng, temp_c: current.feelslike_c, temp_f: current.feelslike_f }),
                i18next.t('weather.current.uv_index', { lng, uv: uvIndex[current.uv] }),
                i18next.t('weather.current.wind_direction', { lng, direction: compass[current.wind_dir], degree: current.wind_degree }),
                i18next.t('weather.current.wind_speed', { lng, speed_kph: current.wind_kph, speed_mph: current.wind_mph }),
                i18next.t('weather.current.wind_gust', { lng, gust_kph: current.gust_kph, gust_mph: current.gust_mph }),
                i18next.t('weather.current.pressure', { lng, pressure_mb: current.pressure_mb, pressure_in: current.pressure_in }),
                i18next.t('weather.current.precipitation', { lng, precipitation_mm: current.precip_mm, precipitation_in: current.precip_in }),
                i18next.t('weather.current.visibility', { lng, vis_km: current.vis_km, vis_miles: current.vis_miles }),
                i18next.t('weather.current.last_updated', { lng, updated: current.last_updated }),
              ].join('\n'),
            },
            {
              name: i18next.t('weather.quality.title', { lng }),
              value: [
                i18next.t('weather.quality.co', { lng, co: (Math.round(current.air_quality.co + Number.EPSILON) * 100) / 100 }),
                i18next.t('weather.quality.o3', { lng, o3: (Math.round(current.air_quality.o3 + Number.EPSILON) * 100) / 100 }),
                i18next.t('weather.quality.no2', { lng, no2: (Math.round(current.air_quality.no2 + Number.EPSILON) * 100) / 100 }),
                i18next.t('weather.quality.so2', { lng, so2: (Math.round(current.air_quality.so2 + Number.EPSILON) * 100) / 100 }),
                i18next.t('weather.quality.pm2_5', { lng, pm2_5: (Math.round(current.air_quality.pm2_5 + Number.EPSILON) * 100) / 100 }),
                i18next.t('weather.quality.pm10', { lng, pm10: (Math.round(current.air_quality.pm10 + Number.EPSILON) * 100) / 100 }),
                i18next.t('weather.quality.epa_index', { lng, index: epaIndex[current.air_quality['us-epa-index']] }),
                i18next.t('weather.quality.defra_index', { lng, index: defraIndex[current.air_quality['gb-defra-index']] }),
              ].join('\n'),
            }
          );
        if (current.condition.icon) currentEmbed.setThumbnail(`https:${current.condition.icon}`);

        interaction.editReply({ embeds: [currentEmbed] });
        break;
      case 'forecast':
        const weatherForecast = await getWeatherForecast(userLocation, days);
        if (!weatherForecast) return interaction.editReply({ content: i18next.t('weather.none', { lng }) });
        const { location: forecastLocation } = weatherForecast;

        const forecastEmbeds: EmbedBuilder[] = [
          new EmbedBuilder()
            .setColor(Colors.Aqua)
            .setTitle(i18next.t('weather.location.title', { lng }))
            .setDescription(
              [
                i18next.t('weather.location.name', { lng, name: forecastLocation.name }),
                i18next.t('weather.location.region', { lng, region: forecastLocation.region }),
                i18next.t('weather.location.country', { lng, country: forecastLocation.country }),
                i18next.t('weather.location.coordinates', { lng, latitude: forecastLocation.lat, longitude: forecastLocation.lon }),
                i18next.t('weather.location.localtime', { lng, localtime: forecastLocation.localtime }),
                i18next.t('weather.location.timezone', { lng, timezone: forecastLocation.tz_id }),
              ].join('\n')
            ),
        ];

        for (const forecastday of weatherForecast.forecast.forecastday) {
          const { day, astro } = forecastday;

          const forecastEmbed = new EmbedBuilder()
            .setColor(Colors.Aqua)
            .setTitle(i18next.t('weather.forecast.title', { lng, date: forecastday.date }))
            .setDescription(
              [
                i18next.t('weather.forecast.condition', { lng, condition: day.condition.text }),
                i18next.t('weather.forecast.avg_humidity', { lng, humidity: day.avghumidity }),
                i18next.t('weather.forecast.rain_chance', { lng, chance: day.daily_chance_of_rain }),
                i18next.t('weather.forecast.snow_chance', { lng, chance: day.daily_chance_of_snow }),
                i18next.t('weather.forecast.max_temp', { lng, temp_c: day.maxtemp_c, temp_f: day.maxtemp_f }),
                i18next.t('weather.forecast.min_temp', { lng, temp_c: day.mintemp_c, temp_f: day.mintemp_f }),
                i18next.t('weather.forecast.avg_temp', { lng, temp_c: day.avgtemp_c, temp_f: day.avgtemp_f }),
                i18next.t('weather.forecast.uv_index', { lng, uv: uvIndex[day.uv] }),
                i18next.t('weather.forecast.max_wind_speed', { lng, speed_kph: day.maxwind_kph, speed_mph: day.maxwind_mph }),
                i18next.t('weather.forecast.total_precipitation', { lng, precipitation_mm: day.totalprecip_mm, precipitation_in: day.totalprecip_in }),
                i18next.t('weather.forecast.total_snowfall', { lng, snowfall: day.totalsnow_cm }),
                i18next.t('weather.forecast.avg_visibility', { lng, vis_km: day.avgvis_km, vis_miles: day.avgvis_miles }),
              ].join('\n')
            )
            .addFields(
              {
                name: i18next.t('weather.astro.title', { lng }),
                value: [
                  i18next.t('weather.astro.sunrise', { lng, sunrise: astro.sunrise }),
                  i18next.t('weather.astro.sunset', { lng, sunset: astro.sunset }),
                  i18next.t('weather.astro.moonset', { lng, moonset: astro.moonset }),
                  i18next.t('weather.astro.moon_phase', { lng, phase: astro.moon_phase }),
                  i18next.t('weather.astro.moon_illumination', { lng, illumination: astro.moon_illumination }),
                ].join('\n'),
              },
              {
                name: i18next.t('weather.quality.title', { lng }),
                value: [
                  i18next.t('weather.quality.co', { lng, co: (Math.round(day.air_quality.co + Number.EPSILON) * 100) / 100 }),
                  i18next.t('weather.quality.o3', { lng, o3: (Math.round(day.air_quality.o3 + Number.EPSILON) * 100) / 100 }),
                  i18next.t('weather.quality.no2', { lng, no2: (Math.round(day.air_quality.no2 + Number.EPSILON) * 100) / 100 }),
                  i18next.t('weather.quality.so2', { lng, so2: (Math.round(day.air_quality.so2 + Number.EPSILON) * 100) / 100 }),
                  i18next.t('weather.quality.pm2_5', { lng, pm2_5: (Math.round(day.air_quality.pm2_5 + Number.EPSILON) * 100) / 100 }),
                  i18next.t('weather.quality.pm10', { lng, pm10: (Math.round(day.air_quality.pm10 + Number.EPSILON) * 100) / 100 }),
                  i18next.t('weather.quality.epa_index', { lng, index: epaIndex[day.air_quality['us-epa-index']] }),
                  i18next.t('weather.quality.defra_index', { lng, index: defraIndex[day.air_quality['gb-defra-index']] }),
                ].join('\n'),
              }
            );
          if (day.condition.icon) forecastEmbed.setThumbnail(`https:${day.condition.icon}`);
          forecastEmbeds.push(forecastEmbed);
        }

        interaction.editReply({ embeds: forecastEmbeds });
        break;
      case 'history':
        const userDate = options.getString('date', true);
        const currentDate = new Date();

        const dayjsDate = dayjs(userDate);
        if (!dayjsDate.isValid())
          return interaction.editReply({
            content: i18next.t('weather.history.date', {
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

        const historicWeather = await getHistoricWeather(userLocation, dayjsDate.format('YYYY-MM-DD'));
        if (!historicWeather) return interaction.editReply({ content: i18next.t('weather.none', { lng }) });
        const { location: historicLocation, forecast } = historicWeather;
        const { astro, day, date } = forecast.forecastday[0];

        const historicEmbed = new EmbedBuilder()
          .setColor(Colors.Aqua)
          .setTitle(i18next.t('weather.history.embed_title', { lng, date }))
          .addFields(
            {
              name: i18next.t('weather.location.title', { lng }),
              value: [
                i18next.t('weather.location.name', { lng, name: historicLocation.name }),
                i18next.t('weather.location.region', { lng, region: historicLocation.region }),
                i18next.t('weather.location.country', { lng, country: historicLocation.country }),
                i18next.t('weather.location.coordinates', { lng, latitude: historicLocation.lat, longitude: historicLocation.lon }),
                i18next.t('weather.location.localtime', { lng, localtime: historicLocation.localtime }),
                i18next.t('weather.location.timezone', { lng, timezone: historicLocation.tz_id }),
              ].join('\n'),
            },
            {
              name: i18next.t('weather.history.title', { lng }),
              value: [
                i18next.t('weather.history.condition', { lng, condition: day.condition.text }),
                i18next.t('weather.history.avg_humidity', { lng, humidity: day.avghumidity }),
                i18next.t('weather.history.rain_chance', { lng, chance: day.daily_chance_of_rain }),
                i18next.t('weather.history.snow_chance', { lng, chance: day.daily_chance_of_snow }),
                i18next.t('weather.history.max_temp', { lng, temp_c: day.maxtemp_c, temp_f: day.maxtemp_f }),
                i18next.t('weather.history.min_temp', { lng, temp_c: day.mintemp_c, temp_f: day.mintemp_f }),
                i18next.t('weather.history.avg_temp', { lng, temp_c: day.avgtemp_c, temp_f: day.avgtemp_f }),
                i18next.t('weather.history.uv_index', { lng, uv: uvIndex[day.uv] }),
                i18next.t('weather.history.max_wind_speed', { lng, speed_kph: day.maxwind_kph, speed_mph: day.maxwind_mph }),
                i18next.t('weather.history.total_precipitation', { lng, precipitation_mm: day.totalprecip_mm, precipitation_in: day.totalprecip_in }),
                i18next.t('weather.history.total_snowfall', { lng, snowfall: day.totalsnow_cm }),
                i18next.t('weather.history.avg_visibility', { lng, vis_km: day.avgvis_km, vis_miles: day.avgvis_miles }),
              ].join('\n'),
            },
            {
              name: i18next.t('weather.astro.title', { lng }),
              value: [
                i18next.t('weather.astro.sunrise', { lng, sunrise: astro.sunrise }),
                i18next.t('weather.astro.sunset', { lng, sunset: astro.sunset }),
                i18next.t('weather.astro.moonset', { lng, moonset: astro.moonset }),
                i18next.t('weather.astro.moon_phase', { lng, phase: astro.moon_phase }),
                i18next.t('weather.astro.moon_illumination', { lng, illumination: astro.moon_illumination }),
              ].join('\n'),
            }
          );
        if (day.condition.icon) historicEmbed.setThumbnail(`http:${day.condition.icon}`);

        interaction.editReply({ embeds: [historicEmbed] });
        break;
    }
  },
});
