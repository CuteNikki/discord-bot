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
        .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to false will show the message to everyone').setRequired(false))
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
              { name: '3 day', value: '3' }
            ])
        )
        .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to true it will only shows the message to you').setRequired(false))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('history')
        .setDescription('Get the weather history')
        .addStringOption((option) => option.setName('location').setDescription('The location to get weather information for').setRequired(true))
        .addStringOption((option) => option.setName('date').setDescription('The date to get weather information for').setRequired(true))
        .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to true it will only shows the message to you').setRequired(false))
    ),
  async execute({ interaction, client, lng }) {
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const { options } = interaction;

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
            .setTitle(t('weather.current.embed-title', { lng }))
            .addFields(
              {
                name: t('weather.location.title', { lng }),
                value: [
                  t('weather.location.name', { lng, name: location.name }),
                  t('weather.location.region', {
                    lng,
                    region: location.region
                  }),
                  t('weather.location.country', {
                    lng,
                    country: location.country
                  }),
                  t('weather.location.coordinates', {
                    lng,
                    latitude: location.lat,
                    longitude: location.lon
                  }),
                  t('weather.location.localtime', {
                    lng,
                    localtime: location.localtime
                  }),
                  t('weather.location.timezone', {
                    lng,
                    timezone: location.tz_id
                  })
                ].join('\n')
              },
              {
                name: t('weather.current.title', { lng }),
                value: [
                  t('weather.current.condition', {
                    lng,
                    condition: current.condition.text
                  }),
                  t('weather.current.humidity', {
                    lng,
                    humidity: current.humidity
                  }),
                  t('weather.current.cloud', { lng, coverage: current.cloud }),
                  t('weather.current.temperature', {
                    lng,
                    tempC: current.temp_c,
                    tempF: current.temp_f
                  }),
                  t('weather.current.feels-like', {
                    lng,
                    tempC: current.feelslike_c,
                    tempF: current.feelslike_f
                  }),
                  t('weather.current.uv-index', { lng, uv: UV_INDEX[current.uv] }),
                  t('weather.current.wind-direction', {
                    lng,
                    direction: COMPASS[current.wind_dir],
                    degree: current.wind_degree
                  }),
                  t('weather.current.wind-speed', {
                    lng,
                    speedKph: current.wind_kph,
                    speedMph: current.wind_mph
                  }),
                  t('weather.current.wind-gust', {
                    lng,
                    gustKph: current.gust_kph,
                    gustMph: current.gust_mph
                  }),
                  t('weather.current.pressure', {
                    lng,
                    pressureMb: current.pressure_mb,
                    pressureIn: current.pressure_in
                  }),
                  t('weather.current.precipitation', {
                    lng,
                    precipitationMm: current.precip_mm,
                    precipitationIn: current.precip_in
                  }),
                  t('weather.current.visibility', {
                    lng,
                    visKm: current.vis_km,
                    visMiles: current.vis_miles
                  }),
                  t('weather.current.last-updated', {
                    lng,
                    updated: current.last_updated
                  })
                ].join('\n')
              },
              {
                name: t('weather.quality.title', { lng }),
                value: [
                  t('weather.quality.co', {
                    lng,
                    co: (Math.round(current.air_quality.co + Number.EPSILON) * 100) / 100
                  }),
                  t('weather.quality.o3', {
                    lng,
                    o3: (Math.round(current.air_quality.o3 + Number.EPSILON) * 100) / 100
                  }),
                  t('weather.quality.no2', {
                    lng,
                    no2: (Math.round(current.air_quality.no2 + Number.EPSILON) * 100) / 100
                  }),
                  t('weather.quality.so2', {
                    lng,
                    so2: (Math.round(current.air_quality.so2 + Number.EPSILON) * 100) / 100
                  }),
                  t('weather.quality.pm2-5', {
                    lng,
                    pm25: (Math.round(current.air_quality.pm2_5 + Number.EPSILON) * 100) / 100
                  }),
                  t('weather.quality.pm10', {
                    lng,
                    pm10: (Math.round(current.air_quality.pm10 + Number.EPSILON) * 100) / 100
                  }),
                  t('weather.quality.epa-index', {
                    lng,
                    index: US_EPA_INDEX[current.air_quality['us-epa-index']]
                  }),
                  t('weather.quality.defra-index', {
                    lng,
                    index: UK_DEFRA_INDEX[current.air_quality['gb-defra-index']]
                  })
                ].join('\n')
              }
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
                    name: location.name
                  }),
                  t('weather.location.region', {
                    lng,
                    region: location.region
                  }),
                  t('weather.location.country', {
                    lng,
                    country: location.country
                  }),
                  t('weather.location.coordinates', {
                    lng,
                    latitude: location.lat,
                    longitude: location.lon
                  }),
                  t('weather.location.localtime', {
                    lng,
                    localtime: location.localtime
                  }),
                  t('weather.location.timezone', {
                    lng,
                    timezone: location.tz_id
                  })
                ].join('\n')
              )
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
                    condition: day.condition.text
                  }),
                  t('weather.forecast.avg-humidity', {
                    lng,
                    humidity: day.avghumidity
                  }),
                  t('weather.forecast.rain-chance', {
                    lng,
                    chance: day.daily_chance_of_rain
                  }),
                  t('weather.forecast.snow-chance', {
                    lng,
                    chance: day.daily_chance_of_snow
                  }),
                  t('weather.forecast.max-temp', {
                    lng,
                    tempC: day.maxtemp_c,
                    tempF: day.maxtemp_f
                  }),
                  t('weather.forecast.min-temp', {
                    lng,
                    tempC: day.mintemp_c,
                    tempF: day.mintemp_f
                  }),
                  t('weather.forecast.avg-temp', {
                    lng,
                    tempC: day.avgtemp_c,
                    tempF: day.avgtemp_f
                  }),
                  t('weather.forecast.uv-index', { lng, uv: UV_INDEX[day.uv] }),
                  t('weather.forecast.max-wind-speed', {
                    lng,
                    speedKph: day.maxwind_kph,
                    speedMph: day.maxwind_mph
                  }),
                  t('weather.forecast.total-precipitation', {
                    lng,
                    precipitationMm: day.totalprecip_mm,
                    precipitationIn: day.totalprecip_in
                  }),
                  t('weather.forecast.total-snowfall', {
                    lng,
                    snowfall: day.totalsnow_cm
                  }),
                  t('weather.forecast.avg-visibility', {
                    lng,
                    visKm: day.avgvis_km,
                    visMiles: day.avgvis_miles
                  })
                ].join('\n')
              )
              .addFields({
                name: t('weather.astro.title', { lng }),
                value: [
                  t('weather.astro.sunrise', { lng, sunrise: astro.sunrise }),
                  t('weather.astro.sunset', { lng, sunset: astro.sunset }),
                  t('weather.astro.moonset', { lng, moonset: astro.moonset }),
                  t('weather.astro.moon-phase', { lng, phase: astro.moon_phase }),
                  t('weather.astro.moon-illumination', {
                    lng,
                    illumination: astro.moon_illumination
                  })
                ].join('\n')
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
                  `\`MM DD YYYY\` - ${dayjs(currentDate).format('MM DD YYYY')}`
                ].join('\n')
              })
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
                    name: location.name
                  }),
                  t('weather.location.region', {
                    lng,
                    region: location.region
                  }),
                  t('weather.location.country', {
                    lng,
                    country: location.country
                  }),
                  t('weather.location.coordinates', {
                    lng,
                    latitude: location.lat,
                    longitude: location.lon
                  }),
                  t('weather.location.localtime', {
                    lng,
                    localtime: location.localtime
                  }),
                  t('weather.location.timezone', {
                    lng,
                    timezone: location.tz_id
                  })
                ].join('\n')
              },
              {
                name: t('weather.history.title', { lng }),
                value: [
                  t('weather.history.condition', {
                    lng,
                    condition: day.condition.text
                  }),
                  t('weather.history.avg-humidity', {
                    lng,
                    humidity: day.avghumidity
                  }),
                  t('weather.history.rain-chance', {
                    lng,
                    chance: day.daily_chance_of_rain
                  }),
                  t('weather.history.snow-chance', {
                    lng,
                    chance: day.daily_chance_of_snow
                  }),
                  t('weather.history.max-temp', {
                    lng,
                    tempC: day.maxtemp_c,
                    tempF: day.maxtemp_f
                  }),
                  t('weather.history.min-temp', {
                    lng,
                    tempC: day.mintemp_c,
                    tempF: day.mintemp_f
                  }),
                  t('weather.history.avg-temp', {
                    lng,
                    tempC: day.avgtemp_c,
                    tempF: day.avgtemp_f
                  }),
                  t('weather.history.uv-index', { lng, uv: UV_INDEX[day.uv] }),
                  t('weather.history.max-wind-speed', {
                    lng,
                    speedKph: day.maxwind_kph,
                    speedMph: day.maxwind_mph
                  }),
                  t('weather.history.total-precipitation', {
                    lng,
                    precipitationMm: day.totalprecip_mm,
                    precipitationIn: day.totalprecip_in
                  }),
                  t('weather.history.total-snowfall', {
                    lng,
                    snowfall: day.totalsnow_cm
                  }),
                  t('weather.history.avg-visibility', {
                    lng,
                    visKm: day.avgvis_km,
                    visMiles: day.avgvis_miles
                  })
                ].join('\n')
              },
              {
                name: t('weather.astro.title', { lng }),
                value: [
                  t('weather.astro.sunrise', { lng, sunrise: astro.sunrise }),
                  t('weather.astro.sunset', { lng, sunset: astro.sunset }),
                  t('weather.astro.moonset', { lng, moonset: astro.moonset }),
                  t('weather.astro.moon-phase', { lng, phase: astro.moon_phase }),
                  t('weather.astro.moon-illumination', {
                    lng,
                    illumination: astro.moon_illumination
                  })
                ].join('\n')
              }
            );

          if (day.condition.icon) {
            embed.setThumbnail(`https:${day.condition.icon}`);
          }

          await interaction.editReply({ embeds: [embed] });
        }
        break;
    }
  }
});
