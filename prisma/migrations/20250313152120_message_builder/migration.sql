-- CreateTable
CREATE TABLE "MessageBuilder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guildId" TEXT,
    "channelId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageBuilder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messagebuilder_user" ON "MessageBuilder"("userId");

-- AddForeignKey
ALTER TABLE "MessageBuilder" ADD CONSTRAINT "MessageBuilder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
