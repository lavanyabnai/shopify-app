-- CreateTable
CREATE TABLE "RecommendedAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "estimatedROI" REAL NOT NULL,
    "confidence" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "parameters" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "sourceMetrics" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME
);

-- CreateTable
CREATE TABLE "ExecutedAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "resultMessage" TEXT,
    "actualRevenue" REAL,
    "estimatedRevenue" REAL,
    "cost" REAL,
    "netROI" REAL,
    "metadata" TEXT NOT NULL,
    "executedBy" TEXT NOT NULL,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canRollback" BOOLEAN NOT NULL DEFAULT false,
    "rolledBackAt" DATETIME,
    "rollbackReason" TEXT,
    CONSTRAINT "ExecutedAction_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "RecommendedAction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parameters" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "RecommendedAction_shop_status_priority_idx" ON "RecommendedAction"("shop", "status", "priority");

-- CreateIndex
CREATE INDEX "RecommendedAction_shop_type_idx" ON "RecommendedAction"("shop", "type");

-- CreateIndex
CREATE INDEX "RecommendedAction_shop_urgency_idx" ON "RecommendedAction"("shop", "urgency");

-- CreateIndex
CREATE INDEX "RecommendedAction_expiresAt_idx" ON "RecommendedAction"("expiresAt");

-- CreateIndex
CREATE INDEX "ExecutedAction_shop_recommendationId_idx" ON "ExecutedAction"("shop", "recommendationId");

-- CreateIndex
CREATE INDEX "ExecutedAction_shop_executedAt_idx" ON "ExecutedAction"("shop", "executedAt");

-- CreateIndex
CREATE INDEX "ExecutedAction_shop_result_idx" ON "ExecutedAction"("shop", "result");

-- CreateIndex
CREATE INDEX "ActionTemplate_shop_type_active_idx" ON "ActionTemplate"("shop", "type", "active");

-- CreateIndex
CREATE INDEX "ActionTemplate_type_active_idx" ON "ActionTemplate"("type", "active");
