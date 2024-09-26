import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';
import ms from 'ms';

import { Command, ModuleType } from 'classes/command';

import { createReminder, deleteReminder, getReminders } from 'db/reminder';
import { getUserLanguage } from 'db/user';

export default new Command({
  module: ModuleType.Utilities,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Create, delete and view reminders')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Create a reminder')
        .addStringOption((option) => option.setName('message').setDescription('What to remind you about').setRequired(true))
        .addStringOption((option) => option.setName('time').setDescription('When to remind you (example: 2 hours)').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Delete a reminder')
        .addStringOption((option) => option.setName('reminder-id').setDescription('The id of the reminder').setRequired(true)),
    )
    .addSubcommand((subcommand) => subcommand.setName('list').setDescription('Lists all your reminders')),
  async execute({ interaction, client }) {
    await interaction.deferReply({ ephemeral: true });

    const { user, options, channelId } = interaction;
    const lng = await getUserLanguage(user.id);

    const reminders = await getReminders(user.id);

    switch (options.getSubcommand()) {
      case 'create':
        {
          if (reminders.length >= 10) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reminder.max', { lng }))] });
            return;
          }

          const message = options.getString('message', true);
          const time = options.getString('time', true);

          const milliseconds = ms(time);
          if (!milliseconds || milliseconds > ms('31d')) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reminder.invalid_time', { lng }))] });
            return;
          }
          const remindAt = Date.now() + milliseconds;

          const reminder = await createReminder(user.id, channelId, remindAt, message);

          await interaction.editReply({
            embeds: [
              new EmbedBuilder().setColor(client.colors.utilities).setDescription(
                t('reminder.created', {
                  lng,
                  time: ms(milliseconds, { long: true }),
                  message,
                  id: reminder._id,
                }),
              ),
            ],
          });
        }
        break;
      case 'delete':
        {
          const reminderId = options.getString('reminder-id', true);

          if (!reminders.map((reminder) => reminder._id.toString()).includes(reminderId)) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reminder.invalid_id', { lng }))] });
            return;
          }

          await deleteReminder(reminderId);
          await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.utilities).setDescription(t('reminder.deleted', { lng }))] });
        }
        break;
      case 'list':
        {
          if (!reminders.length) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('reminder.none', { lng }))] });
            return;
          }

          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.utilities)
                .setDescription(t('reminder.list', { lng }))
                .addFields(
                  reminders.map((reminder) => ({
                    name: `${reminder._id}`,
                    value: [`<t:${Math.floor(reminder.remindAt / 1000)}:R>`, reminder.message].join('\n'),
                  })),
                ),
            ],
          });
        }
        break;
    }
  },
});
