-- CreateTable
CREATE TABLE "Simulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "parameters" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" REAL NOT NULL DEFAULT 0,
    "impactScore" REAL,
    "riskLevel" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "errorMessage" TEXT
);

-- CreateTable
CREATE TABLE "SimulationResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "simulationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "metrics" TEXT NOT NULL,
    "predictions" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "impactScore" REAL NOT NULL,
    "severity" TEXT NOT NULL,
    "baseline" TEXT,
    "delta" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SimulationResult_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Playbook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "tags" TEXT,
    "triggers" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "autoExecute" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" DATETIME,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Simulation_shop_status_idx" ON "Simulation"("shop", "status");

-- CreateIndex
CREATE INDEX "Simulation_shop_scenario_idx" ON "Simulation"("shop", "scenario");

-- CreateIndex
CREATE INDEX "Simulation_shop_createdAt_idx" ON "Simulation"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "SimulationResult_simulationId_idx" ON "SimulationResult"("simulationId");

-- CreateIndex
CREATE INDEX "SimulationResult_simulationId_category_idx" ON "SimulationResult"("simulationId", "category");

-- CreateIndex
CREATE INDEX "Playbook_shop_scenario_active_idx" ON "Playbook"("shop", "scenario", "active");

-- CreateIndex
CREATE INDEX "Playbook_scenario_active_idx" ON "Playbook"("scenario", "active");
