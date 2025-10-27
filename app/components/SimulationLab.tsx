/**
 * Simulation Lab Component (Session 7)
 *
 * Interactive UI for running what-if scenarios:
 * - Scenario parameter inputs
 * - Run simulation button
 * - Results comparison table
 * - Playbook selector
 * - Simulation history
 */

import {
  Card,
  BlockStack,
  InlineGrid,
  Text,
  Button,
  Select,
  TextField,
  InlineStack,
  Badge,
  Box,
  Divider,
  DataTable,
  Icon,
  ProgressBar,
  Banner,
  ButtonGroup,
} from "@shopify/polaris";
import {
  PlayIcon,
  DeleteIcon,
  ViewIcon,
  RefreshIcon,
} from "@shopify/polaris-icons";
import { useState } from "react";
import type {
  Simulation,
  ScenarioType,
  SimulationParameters,
} from "../services/simulation-engine.server";
import type { Playbook } from "../services/playbook-manager.server";

// ============================================================================
// Types
// ============================================================================

interface SimulationLabProps {
  simulations: Simulation[];
  playbooks: Playbook[];
  onRunSimulation: (
    name: string,
    scenario: ScenarioType,
    parameters: SimulationParameters
  ) => Promise<void>;
  onDeleteSimulation: (simulationId: string) => Promise<void>;
  onViewSimulation: (simulationId: string) => void;
  onExecutePlaybook: (playbookId: string) => Promise<void>;
  onRefresh: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function SimulationLab({
  simulations,
  playbooks,
  onRunSimulation,
  onDeleteSimulation,
  onViewSimulation,
  onExecutePlaybook,
  onRefresh,
}: SimulationLabProps) {
  const [activeTab, setActiveTab] = useState<"new" | "history" | "playbooks">("new");

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="600">
          {/* Header */}
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="200">
              <Text variant="headingLg" as="h2">
                Simulation Command Center
              </Text>
              <Text variant="bodySm" tone="subdued" as="p">
                Test what-if scenarios and execute contingency playbooks
              </Text>
            </BlockStack>
            <Button icon={RefreshIcon} onClick={onRefresh}>
              Refresh
            </Button>
          </InlineStack>

          <Divider />

          {/* Tab Navigation */}
          <InlineStack gap="200">
            <Button
              pressed={activeTab === "new"}
              onClick={() => setActiveTab("new")}
            >
              New Simulation
            </Button>
            <Button
              pressed={activeTab === "history"}
              onClick={() => setActiveTab("history")}
            >
              History ({simulations.length})
            </Button>
            <Button
              pressed={activeTab === "playbooks"}
              onClick={() => setActiveTab("playbooks")}
            >
              Playbooks ({playbooks.length})
            </Button>
          </InlineStack>

          {/* Tab Content */}
          {activeTab === "new" && (
            <NewSimulationForm onRunSimulation={onRunSimulation} />
          )}

          {activeTab === "history" && (
            <SimulationHistory
              simulations={simulations}
              onDelete={onDeleteSimulation}
              onView={onViewSimulation}
            />
          )}

          {activeTab === "playbooks" && (
            <PlaybookLibrary
              playbooks={playbooks}
              onExecute={onExecutePlaybook}
            />
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

// ============================================================================
// New Simulation Form
// ============================================================================

function NewSimulationForm({
  onRunSimulation,
}: {
  onRunSimulation: (
    name: string,
    scenario: ScenarioType,
    parameters: SimulationParameters
  ) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [scenario, setScenario] = useState<ScenarioType>("flash_sale");
  const [isRunning, setIsRunning] = useState(false);

  // Flash sale parameters
  const [discountPercent, setDiscountPercent] = useState("30");
  const [trafficMultiplier, setTrafficMultiplier] = useState("5");
  const [durationHours, setDurationHours] = useState("4");

  // Supplier delay parameters
  const [delayDays, setDelayDays] = useState("7");
  const [hasAlternatives, setHasAlternatives] = useState(true);

  // Carrier outage parameters
  const [extraShippingCost, setExtraShippingCost] = useState("15");

  const scenarioOptions = [
    { label: "Flash Sale", value: "flash_sale" },
    { label: "Traffic Spike", value: "traffic_spike" },
    { label: "Supplier Delay", value: "supplier_delay" },
    { label: "Carrier Outage", value: "carrier_outage" },
    { label: "Competitor Stockout (Opportunity)", value: "competitor_stockout" },
    { label: "Custom", value: "custom" },
  ];

  const handleRun = async () => {
    if (!name.trim()) {
      alert("Please enter a simulation name");
      return;
    }

    setIsRunning(true);
    try {
      const parameters: SimulationParameters = {
        duration_hours: parseInt(durationHours) || 4,
      };

      // Add scenario-specific parameters
      if (scenario === "flash_sale") {
        parameters.discount_percent = parseInt(discountPercent) || 30;
        parameters.expected_traffic_multiplier = parseInt(trafficMultiplier) || 5;
      } else if (scenario === "traffic_spike") {
        parameters.traffic_multiplier = parseInt(trafficMultiplier) || 10;
        parameters.conversion_rate_change = -2;
      } else if (scenario === "supplier_delay") {
        parameters.delay_days = parseInt(delayDays) || 7;
        parameters.alternative_sources = hasAlternatives;
      } else if (scenario === "carrier_outage") {
        parameters.alternative_shipping_cost = parseInt(extraShippingCost) || 15;
      }

      await onRunSimulation(name, scenario, parameters);

      // Reset form
      setName("");
      setScenario("flash_sale");
      setDiscountPercent("30");
      setTrafficMultiplier("5");
      setDurationHours("4");
      setDelayDays("7");
      setExtraShippingCost("15");
    } catch (error: any) {
      alert(`Simulation failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <BlockStack gap="400">
      <Banner tone="info">
        <p>
          Simulations model potential scenarios to help you prepare for various
          situations. Results include impact assessments and recommended actions.
        </p>
      </Banner>

      <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
        <TextField
          label="Simulation Name"
          value={name}
          onChange={setName}
          placeholder="e.g., 'Black Friday Flash Sale'"
          autoComplete="off"
        />

        <Select
          label="Scenario Type"
          options={scenarioOptions}
          value={scenario}
          onChange={(value) => setScenario(value as ScenarioType)}
        />
      </InlineGrid>

      {/* Scenario-specific parameters */}
      {scenario === "flash_sale" && (
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text variant="headingSm" as="h3">
                Flash Sale Parameters
              </Text>
              <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
                <TextField
                  label="Discount %"
                  type="number"
                  value={discountPercent}
                  onChange={setDiscountPercent}
                  suffix="%"
                  autoComplete="off"
                />
                <TextField
                  label="Traffic Multiplier"
                  type="number"
                  value={trafficMultiplier}
                  onChange={setTrafficMultiplier}
                  suffix="x"
                  autoComplete="off"
                />
                <TextField
                  label="Duration"
                  type="number"
                  value={durationHours}
                  onChange={setDurationHours}
                  suffix="hours"
                  autoComplete="off"
                />
              </InlineGrid>
            </BlockStack>
          </Box>
        </Card>
      )}

      {scenario === "traffic_spike" && (
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text variant="headingSm" as="h3">
                Traffic Spike Parameters
              </Text>
              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <TextField
                  label="Traffic Multiplier"
                  type="number"
                  value={trafficMultiplier}
                  onChange={setTrafficMultiplier}
                  suffix="x"
                  helpText="How much traffic increase (e.g., 10x normal)"
                  autoComplete="off"
                />
                <TextField
                  label="Duration"
                  type="number"
                  value={durationHours}
                  onChange={setDurationHours}
                  suffix="hours"
                  autoComplete="off"
                />
              </InlineGrid>
            </BlockStack>
          </Box>
        </Card>
      )}

      {scenario === "supplier_delay" && (
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text variant="headingSm" as="h3">
                Supplier Delay Parameters
              </Text>
              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <TextField
                  label="Delay Duration"
                  type="number"
                  value={delayDays}
                  onChange={setDelayDays}
                  suffix="days"
                  autoComplete="off"
                />
                <Box>
                  <Text variant="bodyMd" as="p">
                    Alternative Sources Available
                  </Text>
                  <InlineStack gap="200">
                    <Button
                      pressed={hasAlternatives}
                      onClick={() => setHasAlternatives(true)}
                    >
                      Yes
                    </Button>
                    <Button
                      pressed={!hasAlternatives}
                      onClick={() => setHasAlternatives(false)}
                    >
                      No
                    </Button>
                  </InlineStack>
                </Box>
              </InlineGrid>
            </BlockStack>
          </Box>
        </Card>
      )}

      {scenario === "carrier_outage" && (
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text variant="headingSm" as="h3">
                Carrier Outage Parameters
              </Text>
              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <TextField
                  label="Duration"
                  type="number"
                  value={durationHours}
                  onChange={setDurationHours}
                  suffix="hours"
                  autoComplete="off"
                />
                <TextField
                  label="Alternative Shipping Cost"
                  type="number"
                  value={extraShippingCost}
                  onChange={setExtraShippingCost}
                  prefix="$"
                  suffix="per order"
                  autoComplete="off"
                />
              </InlineGrid>
            </BlockStack>
          </Box>
        </Card>
      )}

      <Button
        variant="primary"
        icon={PlayIcon}
        onClick={handleRun}
        loading={isRunning}
        fullWidth
      >
        Run Simulation
      </Button>
    </BlockStack>
  );
}

// ============================================================================
// Simulation History
// ============================================================================

function SimulationHistory({
  simulations,
  onDelete,
  onView,
}: {
  simulations: Simulation[];
  onDelete: (id: string) => Promise<void>;
  onView: (id: string) => void;
}) {
  if (simulations.length === 0) {
    return (
      <Banner tone="info">
        <p>No simulations yet. Create your first simulation above!</p>
      </Banner>
    );
  }

  const rows = simulations.map((sim) => [
    <Text variant="bodyMd" as="span" fontWeight="semibold">
      {sim.name}
    </Text>,
    <Badge tone={getScenarioBadgeTone(sim.scenario)}>
      {sim.scenario.replace(/_/g, " ")}
    </Badge>,
    <Badge tone={getStatusBadgeTone(sim.status)}>{sim.status}</Badge>,
    sim.status === "running" ? (
      <Box>
        <ProgressBar progress={sim.progress} size="small" />
        <Text variant="bodySm" tone="subdued" as="span">
          {sim.progress.toFixed(0)}%
        </Text>
      </Box>
    ) : sim.impactScore !== undefined && sim.impactScore !== null ? (
      <InlineStack gap="200" blockAlign="center">
        <Text variant="bodyMd" as="span">
          {sim.impactScore.toFixed(1)}
        </Text>
        <Badge tone={getRiskBadgeTone(sim.riskLevel || "low")}>
          {sim.riskLevel}
        </Badge>
      </InlineStack>
    ) : (
      <Text variant="bodySm" tone="subdued" as="span">
        -
      </Text>
    ),
    new Date(sim.createdAt).toLocaleString(),
    <ButtonGroup>
      <Button
        size="slim"
        icon={ViewIcon}
        onClick={() => onView(sim.id)}
        disabled={sim.status !== "completed"}
      >
        View
      </Button>
      <Button
        size="slim"
        icon={DeleteIcon}
        tone="critical"
        onClick={() => {
          if (confirm(`Delete simulation "${sim.name}"?`)) {
            onDelete(sim.id);
          }
        }}
      >
        Delete
      </Button>
    </ButtonGroup>,
  ]);

  return (
    <BlockStack gap="400">
      <DataTable
        columnContentTypes={["text", "text", "text", "text", "text", "text"]}
        headings={["Name", "Scenario", "Status", "Impact", "Created", "Actions"]}
        rows={rows}
      />
    </BlockStack>
  );
}

// ============================================================================
// Playbook Library
// ============================================================================

function PlaybookLibrary({
  playbooks,
  onExecute,
}: {
  playbooks: Playbook[];
  onExecute: (id: string) => Promise<void>;
}) {
  if (playbooks.length === 0) {
    return (
      <Banner tone="info">
        <p>
          No playbooks available. Playbooks are pre-configured action plans for
          common scenarios.
        </p>
      </Banner>
    );
  }

  return (
    <BlockStack gap="400">
      <Text variant="bodySm" tone="subdued" as="p">
        Playbooks contain pre-configured actions for common scenarios. Execute a
        playbook to generate recommendations based on best practices.
      </Text>

      <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
        {playbooks.map((playbook) => (
          <Card key={playbook.id}>
            <Box padding="400">
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="start">
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h3">
                      {playbook.name}
                    </Text>
                    <InlineStack gap="200">
                      <Badge tone={getScenarioBadgeTone(playbook.scenario)}>
                        {playbook.scenario.replace(/_/g, " ")}
                      </Badge>
                      {playbook.active ? (
                        <Badge tone="success">Active</Badge>
                      ) : (
                        <Badge>Inactive</Badge>
                      )}
                      {playbook.autoExecute && (
                        <Badge tone="attention">Auto-execute</Badge>
                      )}
                    </InlineStack>
                  </BlockStack>
                  <Badge>Priority: {playbook.priority}/10</Badge>
                </InlineStack>

                <Text variant="bodySm" as="p" tone="subdued">
                  {playbook.description}
                </Text>

                <Divider />

                <BlockStack gap="200">
                  <Text variant="bodySm" fontWeight="semibold" as="span">
                    Triggers: {playbook.triggers.length}
                  </Text>
                  <Text variant="bodySm" fontWeight="semibold" as="span">
                    Actions: {playbook.actions.length}
                  </Text>
                  {playbook.timesUsed > 0 && (
                    <Text variant="bodySm" tone="subdued" as="span">
                      Used {playbook.timesUsed} time{playbook.timesUsed !== 1 ? "s" : ""}
                    </Text>
                  )}
                </BlockStack>

                <Button
                  onClick={() => onExecute(playbook.id)}
                  disabled={!playbook.active}
                  fullWidth
                >
                  Execute Playbook
                </Button>
              </BlockStack>
            </Box>
          </Card>
        ))}
      </InlineGrid>
    </BlockStack>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getScenarioBadgeTone(scenario: string): "info" | "success" | "attention" | "warning" | "critical" {
  switch (scenario) {
    case "flash_sale":
      return "success";
    case "traffic_spike":
      return "attention";
    case "supplier_delay":
      return "warning";
    case "carrier_outage":
      return "critical";
    case "competitor_stockout":
      return "info";
    default:
      return "info";
  }
}

function getStatusBadgeTone(status: string): "info" | "success" | "attention" | "warning" | "critical" {
  switch (status) {
    case "completed":
      return "success";
    case "running":
      return "attention";
    case "pending":
      return "info";
    case "failed":
      return "critical";
    default:
      return "info";
  }
}

function getRiskBadgeTone(risk: string): "info" | "success" | "attention" | "warning" | "critical" {
  switch (risk) {
    case "low":
      return "success";
    case "medium":
      return "info";
    case "high":
      return "warning";
    case "critical":
      return "critical";
    default:
      return "info";
  }
}
