import { Events, Message } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildSettings, updateGuildSettings } from 'db/guild';
import { getUserLanguage } from 'db/user';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageCreate,
  once: false,
  async execute(client, message) {
    // Return early if not in guild or author is a bot so we don't react to our own messages
    if (!message.inGuild() || message.author.bot) return;
    const { guildId, channel, author } = message;

    const lng = await getUserLanguage(author.id);
    const config = await getGuildSettings(guildId);

    // Return early if not in counting channel
    if (!config.counting.channelId || channel.id !== config.counting.channelId) return;

    const handleDeletion = async (msg: Message, reason: string) => {
      if (msg.deletable) {
        await msg.delete().catch((err) => logger.debug({ err, message: msg.id }, reason));
      }
    };

    const handleReaction = async (msg: Message, emoji: string) => {
      await msg.react(emoji).catch((err) => logger.debug({ err, message: msg.id }, `Could not react with ${emoji}`));
    };

    const delayDelete = (msg: Message, delay = 5_000) => {
      setTimeout(() => {
        handleDeletion(msg, 'Could not delete message after timeout');
      }, delay);
    };

    // Check if the user is repeating their own number
    if (author.id === config.counting.currentNumberBy) {
      await handleDeletion(message, 'Could not delete message from same user');
      const warnMessage = await message.channel.send(t('counting.warn-repeat', { lng, author }));
      delayDelete(warnMessage);
      return;
    }

    // Check if the sent message is the correct next number
    const nextNumber = config.counting.currentNumber + 1;
    const sentNumber = message.content.match(/^\d+$/)?.[0]; // Match whole numbers only

    if (sentNumber !== nextNumber.toString()) {
      await handleDeletion(message, 'Invalid number sent');

      if (!config.counting.resetOnFail) return;

      await updateGuildSettings(guildId, {
        $set: {
          'counting.currentNumber': 0,
          'counting.currentNumberBy': null,
          'counting.currentNumberAt': null
        }
      });

      const failMessage = await message.channel.send(t('counting.warn-incorrect', { lng, author }));
      delayDelete(failMessage);
      return;
    }

    // Correct number, proceed with updating and reacting
    await handleReaction(message, '✅');

    await updateGuildSettings(guildId, {
      $set: {
        'counting.highestNumber': Math.max(config.counting.highestNumber, nextNumber),
        'counting.highestNumberAt': nextNumber >= config.counting.highestNumber ? Date.now() : config.counting.highestNumberAt,
        'counting.currentNumber': nextNumber,
        'counting.currentNumberBy': author.id,
        'counting.currentNumberAt': Date.now()
      }
    });
  }
});
