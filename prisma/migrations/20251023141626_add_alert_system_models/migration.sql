-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "condition" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "channels" TEXT NOT NULL,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxAlertsPerDay" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AlertHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "ruleId" TEXT,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "channels" TEXT NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "slackSent" BOOLEAN NOT NULL DEFAULT false,
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "inAppSent" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" DATETIME,
    "resolvedAt" DATETIME,
    "resolution" TEXT,
    "triggeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlertHistory_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AlertRule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'default',
    "email" BOOLEAN NOT NULL DEFAULT true,
    "slack" BOOLEAN NOT NULL DEFAULT false,
    "sms" BOOLEAN NOT NULL DEFAULT false,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "emailAddress" TEXT,
    "slackWebhook" TEXT,
    "phoneNumber" TEXT,
    "minSeverity" TEXT NOT NULL DEFAULT 'medium',
    "quietHours" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "AlertRule_shop_active_idx" ON "AlertRule"("shop", "active");

-- CreateIndex
CREATE INDEX "AlertRule_shop_severity_idx" ON "AlertRule"("shop", "severity");

-- CreateIndex
CREATE INDEX "AlertHistory_shop_ruleId_triggeredAt_idx" ON "AlertHistory"("shop", "ruleId", "triggeredAt");

-- CreateIndex
CREATE INDEX "AlertHistory_shop_severity_triggeredAt_idx" ON "AlertHistory"("shop", "severity", "triggeredAt");

-- CreateIndex
CREATE INDEX "AlertHistory_shop_acknowledged_idx" ON "AlertHistory"("shop", "acknowledged");

-- CreateIndex
CREATE INDEX "AlertHistory_shop_alertType_idx" ON "AlertHistory"("shop", "alertType");

-- CreateIndex
CREATE INDEX "NotificationPreference_shop_idx" ON "NotificationPreference"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_shop_userId_key" ON "NotificationPreference"("shop", "userId");
