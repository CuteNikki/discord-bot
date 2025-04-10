import type { MessageStructure } from 'classes/message-builder';
import { prisma } from 'database/index';

export const getMessageBuilder = async (id: string) =>
  prisma.messageBuilder.findUnique({
    where: { id },
  });

export const getMessageBuilders = async (userId: string) =>
  prisma.messageBuilder.findMany({
    where: { userId },
  });

export const updateOrCreateMessageBuilder = async (
  data: MessageStructure & { channelId: string; guildId?: string; messageId?: string; userId: string },
) =>
  data.id
    ? prisma.messageBuilder.update({
        where: { id: data.id },
        data,
      })
    : prisma.messageBuilder.create({
        data,
      });

export const deleteMessageBuilder = async (id: string) =>
  prisma.messageBuilder.delete({
    where: { id },
  });
