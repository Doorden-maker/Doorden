-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BusinessProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "businessCity" TEXT NOT NULL DEFAULT '',
    "businessZip" TEXT NOT NULL DEFAULT '',
    "workingCities" TEXT NOT NULL DEFAULT '',
    "serviceAreas" TEXT NOT NULL,
    "servicesOffered" TEXT NOT NULL,
    "serviceCategory" TEXT NOT NULL DEFAULT '',
    "pricingDescription" TEXT NOT NULL,
    "minRepLevel" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stripeAccountId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BusinessProfile" ("businessName", "contactName", "createdAt", "id", "isActive", "minRepLevel", "phone", "pricingDescription", "serviceAreas", "serviceCategory", "servicesOffered", "stripeAccountId", "updatedAt", "userId") SELECT "businessName", "contactName", "createdAt", "id", "isActive", "minRepLevel", "phone", "pricingDescription", "serviceAreas", "serviceCategory", "servicesOffered", "stripeAccountId", "updatedAt", "userId" FROM "BusinessProfile";
DROP TABLE "BusinessProfile";
ALTER TABLE "new_BusinessProfile" RENAME TO "BusinessProfile";
CREATE UNIQUE INDEX "BusinessProfile_userId_key" ON "BusinessProfile"("userId");
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceNumber" TEXT NOT NULL DEFAULT '',
    "repId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "homeownerName" TEXT NOT NULL,
    "homeownerPhone" TEXT NOT NULL,
    "homeownerAddress" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedPrice" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "repTrainingLevel" INTEGER NOT NULL,
    "declineReason" TEXT,
    "stripePaymentId" TEXT,
    "stripePaymentUrl" TEXT,
    "depositAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_repId_fkey" FOREIGN KEY ("repId") REFERENCES "RepProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Job" ("businessId", "createdAt", "declineReason", "depositAmount", "description", "estimatedPrice", "homeownerAddress", "homeownerName", "homeownerPhone", "id", "repId", "repTrainingLevel", "serviceType", "status", "stripePaymentId", "stripePaymentUrl", "updatedAt") SELECT "businessId", "createdAt", "declineReason", "depositAmount", "description", "estimatedPrice", "homeownerAddress", "homeownerName", "homeownerPhone", "id", "repId", "repTrainingLevel", "serviceType", "status", "stripePaymentId", "stripePaymentUrl", "updatedAt" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
CREATE UNIQUE INDEX "Job_referenceNumber_key" ON "Job"("referenceNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
