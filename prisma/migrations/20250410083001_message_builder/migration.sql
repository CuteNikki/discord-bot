/*
  Warnings:

  - The `embed` column on the `MessageBuilder` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `MessageBuilder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MessageBuilder" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "messageId" DROP NOT NULL,
ALTER COLUMN "content" DROP NOT NULL,
DROP COLUMN "embed",
ADD COLUMN     "embed" JSONB;

-- CreateIndex
CREATE INDEX "messagebuilder_guild" ON "MessageBuilder"("guildId");

-- CreateIndex
CREATE INDEX "messagebuilder_channel" ON "MessageBuilder"("channelId");

-- CreateIndex
CREATE INDEX "messagebuilder_message" ON "MessageBuilder"("messageId");
