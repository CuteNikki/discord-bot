import { Events, Message } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { failedCounting, getCounting, increaseCounting } from 'db/counting';
import { getUserLanguage } from 'db/language';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageCreate,
  once: false,
  async execute(_client, message) {
    if (!message.inGuild() || message.author.bot) {
      return;
    }

    const { guildId, channel, author } = message;

    const lng = await getUserLanguage(author.id);
    const counting = await getCounting(guildId);

    if (!counting || !counting.channelId || channel.id !== counting.channelId) {
      return;
    }

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

    if (author.id === counting.currentNumberBy) {
      await handleDeletion(message, 'Could not delete message from same user');

      const warnMessage = await message.channel
        .send(t('counting.warn-repeat', { lng, author: author.toString() }))
        .catch((err) => logger.debug({ err }, 'Could not send message'));

      if (!warnMessage) {
        return;
      }

      delayDelete(warnMessage);

      return;
    }

    // Check if the sent message is the correct next number
    const nextNumber = counting.currentNumber + 1;
    const sentNumber = message.content.match(/^\d+$/)?.[0]; // Match whole numbers only

    if (sentNumber !== nextNumber.toString()) {
      await handleDeletion(message, 'Invalid number sent');

      if (!counting.resetOnFail) {
        return;
      }

      await failedCounting(guildId);

      const failMessage = await message.channel
        .send(t('counting.warn-incorrect', { lng, author: author.toString() }))
        .catch((err) => logger.debug({ err }, 'Could not send message'));

      if (!failMessage) {
        return;
      }

      delayDelete(failMessage);

      return;
    }

    await handleReaction(message, '✅');

    await increaseCounting(guildId, counting.highestNumber, counting.highestNumberAt, nextNumber, author.id);
  }
});
