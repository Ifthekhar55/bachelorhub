-- AlterTable
ALTER TABLE "UsedItem" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "subCategory" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SavedUsedItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedUsedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsedItemMessage" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsedItemMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsedItemReport" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsedItemReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "itemId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "targetPrice" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedUsedItem_userId_idx" ON "SavedUsedItem"("userId");

-- CreateIndex
CREATE INDEX "SavedUsedItem_itemId_idx" ON "SavedUsedItem"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedUsedItem_userId_itemId_key" ON "SavedUsedItem"("userId", "itemId");

-- CreateIndex
CREATE INDEX "UsedItemMessage_itemId_idx" ON "UsedItemMessage"("itemId");

-- CreateIndex
CREATE INDEX "UsedItemMessage_senderId_idx" ON "UsedItemMessage"("senderId");

-- CreateIndex
CREATE INDEX "UsedItemMessage_receiverId_idx" ON "UsedItemMessage"("receiverId");

-- CreateIndex
CREATE INDEX "UsedItemMessage_createdAt_idx" ON "UsedItemMessage"("createdAt");

-- CreateIndex
CREATE INDEX "UsedItemReport_itemId_idx" ON "UsedItemReport"("itemId");

-- CreateIndex
CREATE INDEX "UsedItemReport_reporterId_idx" ON "UsedItemReport"("reporterId");

-- CreateIndex
CREATE INDEX "UsedItemReport_status_idx" ON "UsedItemReport"("status");

-- CreateIndex
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");

-- CreateIndex
CREATE INDEX "Review_revieweeId_idx" ON "Review"("revieweeId");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PriceAlert_userId_itemId_key" ON "PriceAlert"("userId", "itemId");

-- CreateIndex
CREATE INDEX "Conversation_user1Id_user2Id_idx" ON "Conversation"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "UsedItem_postedById_idx" ON "UsedItem"("postedById");

-- CreateIndex
CREATE INDEX "UsedItem_category_idx" ON "UsedItem"("category");

-- CreateIndex
CREATE INDEX "UsedItem_condition_idx" ON "UsedItem"("condition");

-- CreateIndex
CREATE INDEX "UsedItem_postedAt_idx" ON "UsedItem"("postedAt");

-- CreateIndex
CREATE INDEX "UsedItem_isSold_idx" ON "UsedItem"("isSold");

-- CreateIndex
CREATE INDEX "UsedItem_isUrgent_idx" ON "UsedItem"("isUrgent");

-- AddForeignKey
ALTER TABLE "SavedUsedItem" ADD CONSTRAINT "SavedUsedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedUsedItem" ADD CONSTRAINT "SavedUsedItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "UsedItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsedItemMessage" ADD CONSTRAINT "UsedItemMessage_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "UsedItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsedItemMessage" ADD CONSTRAINT "UsedItemMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsedItemReport" ADD CONSTRAINT "UsedItemReport_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "UsedItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsedItemReport" ADD CONSTRAINT "UsedItemReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "UsedItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
