import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';
import ms from 'ms';

import { Command, ModuleType } from 'classes/command';

import { reminderModel } from 'models/reminder';

export default new Command({
  module: ModuleType.Utilities,
  data: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Create, delete and view reminders')
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create a reminder')
        .addStringOption((option) => option.setName('message').setDescription('What to remind you about').setRequired(true))
        .addStringOption((option) => option.setName('time').setDescription('When to remind you (example: 2 hours)').setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Delete a reminder')
        .addStringOption((option) => option.setName('reminder-id').setDescription('The id of the reminder').setRequired(true))
    )
    .addSubcommand((subcommand) => subcommand.setName('list').setDescription('Lists all your reminders')),
  async execute({ interaction, client }) {
    await interaction.deferReply({ ephemeral: true });
    const { user, options } = interaction;

    const lng = await client.getUserLanguage(user.id);

    const reminders = await reminderModel.find({ userId: user.id }).lean().exec();

    switch (options.getSubcommand()) {
      case 'create':
        {
          if (reminders.length >= 10) return interaction.editReply(t('reminder.amount', { lng }));

          const message = options.getString('message', true);
          const time = options.getString('time', true);

          const milliseconds = ms(time);
          if (!milliseconds || milliseconds > ms('31d')) return interaction.editReply(t('reminder.invalid_time', { lng }));
          const remindAt = Date.now() + milliseconds;

          const reminder = await reminderModel.create({ userId: user.id, channelId: interaction.channel?.id, remindAt, message });
          await interaction.editReply(t('reminder.created', { lng, time: ms(milliseconds, { long: true }), message, id: reminder._id }));
        }
        break;
      case 'delete':
        {
          const reminderId = options.getString('reminder-id', true);
          if (!reminders.map((reminder) => `${reminder._id}`).includes(reminderId)) return interaction.editReply(t('reminder.invalid_id', { lng }));
          await reminderModel.findByIdAndDelete(reminderId).lean().exec();
          await interaction.editReply(t('reminder.deleted', { lng }));
        }
        break;
      case 'list':
        {
          if (!reminders.length) return interaction.editReply(t('reminder.none', { lng }));

          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.Aqua)
                .setDescription(t('reminder.list', { lng }))
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
