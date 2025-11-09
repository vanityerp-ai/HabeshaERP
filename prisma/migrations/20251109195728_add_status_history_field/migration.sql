-- AlterTable
ALTER TABLE "appointments" ADD COLUMN "statusHistory" TEXT;

-- CreateTable
CREATE TABLE "time_off_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "time_off_requests_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "tax" DECIMAL NOT NULL,
    "shipping" DECIMAL NOT NULL,
    "total" DECIMAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "appliedPromo" TEXT,
    "tracking" TEXT,
    "notes" TEXT,
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "processedAt" DATETIME,
    "shippedAt" DATETIME,
    "deliveredAt" DATETIME,
    "cancelledAt" DATETIME,
    "cancellationReason" TEXT
);

-- CreateIndex
CREATE INDEX "time_off_requests_staffId_idx" ON "time_off_requests"("staffId");

-- CreateIndex
CREATE INDEX "time_off_requests_status_idx" ON "time_off_requests"("status");

-- CreateIndex
CREATE INDEX "time_off_requests_startDate_endDate_idx" ON "time_off_requests"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_clientId_idx" ON "orders"("clientId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");
