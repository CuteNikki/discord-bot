import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';
import ms from 'ms';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

import { reminderModel } from 'models/reminder';

export default new Command({
  module: ModuleType.Utilities,
  data: {
    name: 'reminder',
    description: 'Create, delete and view reminders',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.Guild, Contexts.BotDM, Contexts.PrivateChannel],
    integration_types: [IntegrationTypes.GuildInstall, IntegrationTypes.UserInstall],
    options: [
      {
        name: 'create',
        description: 'Create a reminder',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'message',
            description: 'What to remind you about',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: 'time',
            description: 'When to remind you (example: 2 hours)',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'delete',
        description: 'Delete a reminder',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'reminder-id',
            description: 'The id of the reminder',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'list',
        description: 'Lists all your reminders',
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },
  async execute({ interaction, client }) {
    await interaction.deferReply({ ephemeral: true });
    const { user, options } = interaction;

    const lng = await client.getUserLanguage(user.id);

    const reminders = await reminderModel.find({ userId: user.id }).lean().exec();

    switch (options.getSubcommand()) {
      case 'create':
        {
          if (reminders.length >= 10) return interaction.editReply(i18next.t('reminder.amount', { lng }));

          const message = options.getString('message', true);
          const time = options.getString('time', true);

          const milliseconds = ms(time);
          if (!milliseconds || milliseconds > ms('31d')) return interaction.editReply(i18next.t('reminder.invalid_time', { lng }));
          const remindAt = Date.now() + milliseconds;

          const reminder = await reminderModel.create({ userId: user.id, channelId: interaction.channel?.id, remindAt, message });
          await interaction.editReply(i18next.t('reminder.created', { lng, time: ms(milliseconds, { long: true }), message, id: reminder._id }));
        }
        break;
      case 'delete':
        {
          const reminderId = options.getString('reminder-id', true);
          if (!reminders.map((reminder) => `${reminder._id}`).includes(reminderId)) return interaction.editReply(i18next.t('reminder.invalid_id', { lng }));
          await reminderModel.findByIdAndDelete(reminderId).lean().exec();
          await interaction.editReply(i18next.t('reminder.deleted', { lng }));
        }
        break;
      case 'list':
        {
          if (!reminders.length) return interaction.editReply(i18next.t('reminder.none', { lng }));

          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.Aqua)
                .setDescription(i18next.t('reminder.list', { lng }))
                .addFields(
                  reminders.map((reminder) => ({
                    name: `${reminder._id}`,
                    value: [`<t:${Math.floor(reminder.remindAt / 1000)}:R>`, reminder.message].join('\n'),
                  }))
                ),
            ],
          });
        }
        break;
    }
  },
});
