/**
 * Action Center Component
 *
 * Displays prescriptive recommendations with:
 * - Priority ranking and ROI estimates
 * - One-click execution buttons
 * - Action history and audit log
 * - Rollback capabilities
 */

import {
  Card,
  Text,
  BlockStack,
  InlineGrid,
  Box,
  Badge,
  InlineStack,
  DataTable,
  Button,
  Icon,
  Banner,
} from "@shopify/polaris";
import {
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  XCircleIcon,
  RefreshIcon,
} from "@shopify/polaris-icons";
import { useState } from "react";

interface Action {
  id: string;
  type: string;
  priority: number;
  estimatedROI: number;
  confidence: number;
  status: string;
  parameters: any;
  reason: string;
  urgency: string;
  expiresAt?: string;
}

interface ExecutedAction {
  id: string;
  result: string;
  resultMessage: string;
  executedBy: string;
  executedAt: string;
  canRollback: boolean;
  rolledBackAt: string | null;
  recommendation: {
    type: string;
    reason: string;
    parameters: any;
  };
}

interface ActionCenterProps {
  pendingActions: Action[];
  recentExecutions: ExecutedAction[];
  onExecute: (actionId: string) => void;
  onDismiss: (actionId: string) => void;
  onRollback: (executionId: string) => void;
  isExecuting?: boolean;
}

export default function ActionCenter({
  pendingActions,
  recentExecutions,
  onExecute,
  onDismiss,
  onRollback,
  isExecuting = false,
}: ActionCenterProps) {
  const [selectedActions, setSelectedActions] = useState<Set<string>>(
    new Set()
  );

  if (!pendingActions || pendingActions.length === 0) {
    return (
      <Card>
        <Box padding="400">
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">
              💡 Action Center
            </Text>
            <Banner tone="success">
              <p>
                No urgent actions needed right now. All inventory levels are
                healthy and no critical interventions are required.
              </p>
            </Banner>
          </BlockStack>
        </Box>
      </Card>
    );
  }

  // Calculate summary stats
  const criticalCount = pendingActions.filter(
    (a) => a.urgency === "critical"
  ).length;
  const totalROI = pendingActions.reduce((sum, a) => sum + a.estimatedROI, 0);

  return (
    <BlockStack gap="400">
      {/* Summary Cards */}
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              💡 Action Center - Recommended Actions
            </Text>

            <InlineGrid columns={3} gap="400">
              {/* Pending Actions */}
              <Box>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="bodyMd" tone="subdued" as="span">
                      Pending Actions
                    </Text>
                    <Icon source={ClockIcon} tone="base" />
                  </InlineStack>
                  <Text variant="heading2xl" as="h3">
                    {pendingActions.length}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="span">
                    {criticalCount} critical
                  </Text>
                </BlockStack>
              </Box>

              {/* Estimated ROI */}
              <Box>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="bodyMd" tone="subdued" as="span">
                      Total Estimated ROI
                    </Text>
                    <Icon source={CheckCircleIcon} tone="success" />
                  </InlineStack>
                  <Text variant="heading2xl" as="h3" tone="success">
                    ${totalROI.toLocaleString()}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="span">
                    If all actions executed
                  </Text>
                </BlockStack>
              </Box>

              {/* Recent Executions */}
              <Box>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="bodyMd" tone="subdued" as="span">
                      Recent Executions
                    </Text>
                    <Icon source={RefreshIcon} tone="base" />
                  </InlineStack>
                  <Text variant="heading2xl" as="h3">
                    {recentExecutions?.length || 0}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="span">
                    Last 24 hours
                  </Text>
                </BlockStack>
              </Box>
            </InlineGrid>
          </BlockStack>
        </Box>
      </Card>

      {/* Critical Actions Alert */}
      {criticalCount > 0 && (
        <Banner tone="critical">
          <p>
            <strong>{criticalCount} critical actions</strong> require immediate
            attention to prevent stockouts and revenue loss.
          </p>
        </Banner>
      )}

      {/* Pending Actions Table */}
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingMd" as="h2">
                Recommended Actions (Ranked by Priority)
              </Text>
            </InlineStack>

            <ActionTable
              actions={pendingActions}
              onExecute={onExecute}
              onDismiss={onDismiss}
              isExecuting={isExecuting}
            />
          </BlockStack>
        </Box>
      </Card>

      {/* Execution History */}
      {recentExecutions && recentExecutions.length > 0 && (
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                📜 Execution History
              </Text>

              <ExecutionHistoryTable
                executions={recentExecutions}
                onRollback={onRollback}
                isExecuting={isExecuting}
              />
            </BlockStack>
          </Box>
        </Card>
      )}
    </BlockStack>
  );
}

/**
 * Action Table Component
 */
function ActionTable({
  actions,
  onExecute,
  onDismiss,
  isExecuting,
}: {
  actions: Action[];
  onExecute: (id: string) => void;
  onDismiss: (id: string) => void;
  isExecuting: boolean;
}) {
  const rows = actions.map((action) => {
    const urgencyBadge = (
      <Badge tone={getUrgencyBadgeTone(action.urgency)}>
        {action.urgency.toUpperCase()}
      </Badge>
    );

    const typeBadge = (
      <Badge tone="info">{formatActionType(action.type)}</Badge>
    );

    const actionButtons = (
      <InlineStack gap="200">
        <Button
          variant="primary"
          size="slim"
          onClick={() => onExecute(action.id)}
          loading={isExecuting}
        >
          Execute
        </Button>
        <Button
          variant="plain"
          size="slim"
          onClick={() => onDismiss(action.id)}
          disabled={isExecuting}
        >
          Dismiss
        </Button>
      </InlineStack>
    );

    return [
      <BlockStack gap="100">
        <InlineStack gap="200">
          <Text variant="bodyMd" fontWeight="bold" as="span">
            Priority {action.priority}
          </Text>
          {urgencyBadge}
        </InlineStack>
        {typeBadge}
      </BlockStack>,
      <BlockStack gap="100">
        <Text variant="bodyMd" as="p">
          {action.reason}
        </Text>
        <Text variant="bodySm" tone="subdued" as="p">
          {formatActionDetails(action)}
        </Text>
      </BlockStack>,
      <BlockStack gap="100">
        <Text variant="bodyMd" fontWeight="semibold" tone="success" as="span">
          ${action.estimatedROI.toLocaleString()}
        </Text>
        <Text variant="bodySm" tone="subdued" as="span">
          {action.confidence}% confidence
        </Text>
      </BlockStack>,
      actionButtons,
    ];
  });

  return (
    <DataTable
      columnContentTypes={["text", "text", "numeric", "text"]}
      headings={["Priority & Type", "Recommendation", "Est. ROI", "Actions"]}
      rows={rows}
      truncate
    />
  );
}

/**
 * Execution History Table Component
 */
function ExecutionHistoryTable({
  executions,
  onRollback,
  isExecuting,
}: {
  executions: ExecutedAction[];
  onRollback: (id: string) => void;
  isExecuting: boolean;
}) {
  const rows = executions.slice(0, 10).map((execution) => {
    const resultBadge = (
      <Badge tone={getResultBadgeTone(execution.result)}>
        {execution.result}
      </Badge>
    );

    const rollbackButton = execution.canRollback &&
      !execution.rolledBackAt && (
        <Button
          variant="plain"
          size="slim"
          tone="critical"
          onClick={() => onRollback(execution.id)}
          loading={isExecuting}
        >
          Rollback
        </Button>
      );

    const rolledBackBadge = execution.rolledBackAt && (
      <Badge tone="warning">Rolled Back</Badge>
    );

    return [
      <Text variant="bodyMd" as="span">
        {formatActionType(execution.recommendation.type)}
      </Text>,
      <BlockStack gap="100">
        <Text variant="bodyMd" as="p">
          {execution.recommendation.reason}
        </Text>
        <Text variant="bodySm" tone="subdued" as="p">
          {execution.resultMessage}
        </Text>
      </BlockStack>,
      resultBadge,
      <Text variant="bodySm" tone="subdued" as="span">
        {formatTimestamp(execution.executedAt)}
      </Text>,
      <InlineStack gap="200">
        {rollbackButton}
        {rolledBackBadge}
      </InlineStack>,
    ];
  });

  return (
    <DataTable
      columnContentTypes={["text", "text", "text", "text", "text"]}
      headings={["Action Type", "Details", "Result", "Executed At", "Rollback"]}
      rows={rows}
      truncate
    />
  );
}

/**
 * Helper: Get badge tone for urgency
 */
function getUrgencyBadgeTone(
  urgency: string
): "critical" | "warning" | "attention" | "info" {
  switch (urgency) {
    case "critical":
      return "critical";
    case "high":
      return "warning";
    case "medium":
      return "attention";
    case "low":
      return "info";
    default:
      return "info";
  }
}

/**
 * Helper: Get badge tone for execution result
 */
function getResultBadgeTone(
  result: string
): "success" | "warning" | "critical" | "info" {
  switch (result) {
    case "success":
      return "success";
    case "partial_success":
      return "warning";
    case "failed":
      return "critical";
    default:
      return "info";
  }
}

/**
 * Helper: Format action type
 */
function formatActionType(type: string): string {
  switch (type) {
    case "transfer":
      return "📦 Inventory Transfer";
    case "reorder":
      return "📝 Supplier Reorder";
    case "price_adjustment":
      return "💰 Price Adjustment";
    case "traffic_throttle":
      return "🚦 Traffic Control";
    default:
      return type;
  }
}

/**
 * Helper: Format action details
 */
function formatActionDetails(action: Action): string {
  const params = action.parameters;

  switch (action.type) {
    case "transfer":
      return `Transfer ${params.quantity} units from ${params.fromLocation} to ${params.toLocation}`;
    case "reorder":
      return `Order ${params.quantity} units from ${params.supplier} (${params.priority} priority)`;
    case "price_adjustment":
      const direction = params.priceChange > 0 ? "increase" : "decrease";
      return `${direction} price by ${Math.abs(params.priceChange)}% ($${params.currentPrice} → $${params.suggestedPrice.toFixed(2)})`;
    case "traffic_throttle":
      return `${params.action} to reduce traffic by ${params.targetReduction}%`;
    default:
      return JSON.stringify(params);
  }
}

/**
 * Helper: Format timestamp
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}
