-- CreateTable
CREATE TABLE "RepBusinessPartnership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_rep',
    "requestedBy" TEXT NOT NULL DEFAULT 'rep',
    "message" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RepBusinessPartnership_repId_fkey" FOREIGN KEY ("repId") REFERENCES "RepProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RepBusinessPartnership_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HomeownerMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "fromType" TEXT NOT NULL,
    "senderName" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HomeownerMessage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL DEFAULT '',
    "referenceNumber" TEXT NOT NULL DEFAULT '',
    "repId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "homeownerName" TEXT NOT NULL,
    "homeownerPhone" TEXT NOT NULL,
    "homeownerEmail" TEXT NOT NULL DEFAULT '',
    "homeownerAddress" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedPrice" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'lead_created',
    "repTrainingLevel" INTEGER NOT NULL,
    "declineReason" TEXT,
    "moreInfoRequest" TEXT,
    "stripePaymentId" TEXT,
    "stripePaymentUrl" TEXT,
    "depositAmount" REAL,
    "homeownerToken" TEXT NOT NULL DEFAULT '',
    "visitCode" TEXT,
    "visitCodeExpiry" DATETIME,
    "visitCodeVerified" BOOLEAN NOT NULL DEFAULT false,
    "businessDeadline" DATETIME,
    "scheduledDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_repId_fkey" FOREIGN KEY ("repId") REFERENCES "RepProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Job" ("businessId", "createdAt", "declineReason", "depositAmount", "description", "estimatedPrice", "homeownerAddress", "homeownerName", "homeownerPhone", "id", "referenceNumber", "repId", "repTrainingLevel", "serviceType", "status", "stripePaymentId", "stripePaymentUrl", "updatedAt") SELECT "businessId", "createdAt", "declineReason", "depositAmount", "description", "estimatedPrice", "homeownerAddress", "homeownerName", "homeownerPhone", "id", "referenceNumber", "repId", "repTrainingLevel", "serviceType", "status", "stripePaymentId", "stripePaymentUrl", "updatedAt" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
CREATE UNIQUE INDEX "Job_leadId_key" ON "Job"("leadId");
CREATE UNIQUE INDEX "Job_referenceNumber_key" ON "Job"("referenceNumber");
CREATE UNIQUE INDEX "Job_homeownerToken_key" ON "Job"("homeownerToken");
CREATE TABLE "new_RepProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "repCode" TEXT NOT NULL DEFAULT '',
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "serviceAreas" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "trainingLevel" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "availabilityStatus" TEXT NOT NULL DEFAULT 'offline',
    "serviceCategories" TEXT NOT NULL DEFAULT '',
    "rating" REAL NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RepProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RepProfile" ("availabilityStatus", "avatarUrl", "createdAt", "description", "fullName", "id", "isActive", "phone", "rating", "ratingCount", "serviceAreas", "serviceCategories", "trainingLevel", "updatedAt", "userId") SELECT "availabilityStatus", "avatarUrl", "createdAt", "description", "fullName", "id", "isActive", "phone", "rating", "ratingCount", "serviceAreas", "serviceCategories", "trainingLevel", "updatedAt", "userId" FROM "RepProfile";
DROP TABLE "RepProfile";
ALTER TABLE "new_RepProfile" RENAME TO "RepProfile";
CREATE UNIQUE INDEX "RepProfile_userId_key" ON "RepProfile"("userId");
CREATE UNIQUE INDEX "RepProfile_repCode_key" ON "RepProfile"("repCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "RepBusinessPartnership_repId_businessId_key" ON "RepBusinessPartnership"("repId", "businessId");
