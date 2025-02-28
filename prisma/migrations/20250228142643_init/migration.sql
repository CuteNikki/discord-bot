-- CreateEnum
CREATE TYPE "InfractionType" AS ENUM ('Ban', 'Tempban', 'Unban', 'Kick', 'Timeout', 'Warn');

-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Guild" (
    "guildId" TEXT NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "Blacklist" (
    "userId" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3)
);

-- CreateTable
CREATE TABLE "Infraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "type" "InfractionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN DEFAULT false,

    CONSTRAINT "Infraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Guild_guildId_key" ON "Guild"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "Blacklist_userId_key" ON "Blacklist"("userId");

-- CreateIndex
CREATE INDEX "blacklist_moderator" ON "Blacklist"("moderatorId");

-- CreateIndex
CREATE INDEX "infraction_user" ON "Infraction"("userId");

-- CreateIndex
CREATE INDEX "infraction_guild" ON "Infraction"("guildId");

-- CreateIndex
CREATE INDEX "infraction_user_guild" ON "Infraction"("userId", "guildId");

-- CreateIndex
CREATE INDEX "infraction_moderator_guild" ON "Infraction"("moderatorId", "guildId");

-- AddForeignKey
ALTER TABLE "Blacklist" ADD CONSTRAINT "Blacklist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Infraction" ADD CONSTRAINT "Infraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Infraction" ADD CONSTRAINT "Infraction_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("guildId") ON DELETE RESTRICT ON UPDATE CASCADE;
