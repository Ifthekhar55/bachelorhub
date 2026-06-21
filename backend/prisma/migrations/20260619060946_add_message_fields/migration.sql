-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "filename" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "url" TEXT;
