-- CreateTable
CREATE TABLE "BlackListToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlackListToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlackListToken_token_key" ON "BlackListToken"("token");

-- CreateIndex
CREATE INDEX "BlackListToken_createdAt_idx" ON "BlackListToken"("createdAt");
