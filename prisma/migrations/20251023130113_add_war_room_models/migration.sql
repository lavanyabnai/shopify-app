-- CreateTable
CREATE TABLE "WarRoomMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "defconLevel" INTEGER NOT NULL,
    "inventoryCoverageHours" REAL NOT NULL,
    "velocityAnomaly" REAL NOT NULL,
    "riskScore" REAL NOT NULL,
    "escalationTriggers" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventorySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "currentStock" INTEGER NOT NULL,
    "burnRate" REAL NOT NULL,
    "coverageHours" REAL NOT NULL,
    "reorderPoint" INTEGER NOT NULL,
    "velocityTrend" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" DATETIME,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "WarRoomMetrics_shop_createdAt_idx" ON "WarRoomMetrics"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "InventorySnapshot_shop_sku_location_idx" ON "InventorySnapshot"("shop", "sku", "location");

-- CreateIndex
CREATE INDEX "InventorySnapshot_shop_status_idx" ON "InventorySnapshot"("shop", "status");

-- CreateIndex
CREATE INDEX "InventorySnapshot_shop_coverageHours_idx" ON "InventorySnapshot"("shop", "coverageHours");

-- CreateIndex
CREATE INDEX "InventorySnapshot_createdAt_idx" ON "InventorySnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "AlertLog_shop_severity_createdAt_idx" ON "AlertLog"("shop", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "AlertLog_shop_acknowledged_idx" ON "AlertLog"("shop", "acknowledged");
