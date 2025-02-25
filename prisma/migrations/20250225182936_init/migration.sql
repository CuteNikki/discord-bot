-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "BanInfo" (
    "userId" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "bannedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3)
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BanInfo_userId_key" ON "BanInfo"("userId");

-- CreateIndex
CREATE INDEX "moderatorId" ON "BanInfo"("moderatorId");

-- AddForeignKey
ALTER TABLE "BanInfo" ADD CONSTRAINT "BanInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
