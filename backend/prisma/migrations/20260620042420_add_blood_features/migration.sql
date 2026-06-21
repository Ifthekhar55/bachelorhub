-- CreateEnum
CREATE TYPE "EmergencyLevel" AS ENUM ('urgent', 'within_24_hours', 'planned');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('active', 'donor_found', 'completed', 'expired');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('interested', 'unavailable');

-- CreateTable
CREATE TABLE "BloodRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "bloodGroup" TEXT NOT NULL,
    "unitsNeeded" INTEGER NOT NULL,
    "patientName" TEXT,
    "hospitalName" TEXT NOT NULL,
    "hospitalAddress" TEXT NOT NULL,
    "requiredDate" TIMESTAMP(3) NOT NULL,
    "emergencyLevel" "EmergencyLevel" NOT NULL DEFAULT 'urgent',
    "contactNumber" TEXT NOT NULL,
    "additionalNotes" TEXT,
    "location" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "status" "RequestStatus" NOT NULL DEFAULT 'active',
    "donorFound" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BloodRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodDonorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bloodGroup" TEXT NOT NULL,
    "lastDonationDate" TIMESTAMP(3),
    "weight" DOUBLE PRECISION,
    "age" INTEGER,
    "availabilityStatus" BOOLEAN NOT NULL DEFAULT true,
    "city" TEXT,
    "area" TEXT,
    "phoneVisible" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "totalDonations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodDonorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodDonorResponse" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "status" "ResponseStatus" NOT NULL DEFAULT 'interested',
    "message" TEXT,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BloodDonorResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodNotification" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BloodNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BloodRequest_bloodGroup_idx" ON "BloodRequest"("bloodGroup");

-- CreateIndex
CREATE INDEX "BloodRequest_status_idx" ON "BloodRequest"("status");

-- CreateIndex
CREATE INDEX "BloodRequest_emergencyLevel_idx" ON "BloodRequest"("emergencyLevel");

-- CreateIndex
CREATE INDEX "BloodRequest_location_idx" ON "BloodRequest"("location");

-- CreateIndex
CREATE INDEX "BloodRequest_expiresAt_idx" ON "BloodRequest"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "BloodDonorProfile_userId_key" ON "BloodDonorProfile"("userId");

-- CreateIndex
CREATE INDEX "BloodDonorResponse_requestId_idx" ON "BloodDonorResponse"("requestId");

-- CreateIndex
CREATE INDEX "BloodDonorResponse_donorId_idx" ON "BloodDonorResponse"("donorId");

-- CreateIndex
CREATE UNIQUE INDEX "BloodDonorResponse_requestId_donorId_key" ON "BloodDonorResponse"("requestId", "donorId");

-- CreateIndex
CREATE INDEX "BloodNotification_donorId_idx" ON "BloodNotification"("donorId");

-- CreateIndex
CREATE INDEX "BloodNotification_requestId_idx" ON "BloodNotification"("requestId");

-- CreateIndex
CREATE INDEX "BloodNotification_sentAt_idx" ON "BloodNotification"("sentAt");

-- AddForeignKey
ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodDonorProfile" ADD CONSTRAINT "BloodDonorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodDonorResponse" ADD CONSTRAINT "BloodDonorResponse_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodDonorResponse" ADD CONSTRAINT "BloodDonorResponse_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "BloodDonorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodNotification" ADD CONSTRAINT "BloodNotification_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodNotification" ADD CONSTRAINT "BloodNotification_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
