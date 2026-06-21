-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isHomechef" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "specialties" TEXT[],
ADD COLUMN     "experience" TEXT,
ADD COLUMN     "servingArea" TEXT,
ADD COLUMN     "foods" TEXT[],
ADD COLUMN     "schedule" TEXT,
ADD COLUMN     "packages" TEXT,
ADD COLUMN     "foodPhotos" TEXT[],
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reviewsCount" INTEGER NOT NULL DEFAULT 0;
