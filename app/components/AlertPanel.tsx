/**
 * BFCM War Room - Alert Panel Component (Session 5)
 *
 * Displays active alerts, alert history, and notification settings.
 *
 * Features:
 * - Active alerts list with severity badges
 * - Acknowledge/dismiss actions
 * - Alert history timeline
 * - Notification preferences
 * - Alert statistics
 */

import {
  Badge,
  Card,
  EmptyState,
  Icon,
  InlineStack,
  Text,
  Button,
  BlockStack,
  DataTable,
  Banner,
} from "@shopify/polaris";
import { AlertCircleIcon, CheckCircleIcon, ClockIcon } from "@shopify/polaris-icons";

// ============================================================================
// Types
// ============================================================================

interface Alert {
  id: string;
  severity: string;
  title: string;
  message: string;
  alertType: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  triggeredAt: string;
  emailSent: boolean;
  slackSent: boolean;
  smsSent: boolean;
  inAppSent: boolean;
}

interface AlertSummary {
  active: number;
  acknowledged: number;
  resolved: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
}

export interface AlertPanelProps {
  activeAlerts: Alert[];
  alertHistory: Alert[];
  summary: AlertSummary;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  onRefresh: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getSeverityBadge(severity: string) {
  switch (severity) {
    case 'critical':
      return <Badge tone="critical">Critical</Badge>;
    case 'high':
      return <Badge tone="warning">High</Badge>;
    case 'medium':
      return <Badge tone="attention">Medium</Badge>;
    case 'low':
      return <Badge tone="info">Low</Badge>;
    case 'info':
      return <Badge>Info</Badge>;
    default:
      return <Badge>{severity}</Badge>;
  }
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'critical':
    case 'high':
      return AlertCircleIcon;
    default:
      return ClockIcon;
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatAlertType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// Alert Card Component
// ============================================================================

function AlertCard({ alert, onAcknowledge, onResolve }: {
  alert: Alert;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  const isResolved = !!alert.resolvedAt;
  const isAcknowledged = alert.acknowledged && !isResolved;
  const isActive = !alert.acknowledged && !isResolved;

  return (
    <Card>
      <BlockStack gap="400">
        {/* Header */}
        <InlineStack align="space-between" blockAlign="start">
          <InlineStack gap="200" blockAlign="center">
            <Icon source={getSeverityIcon(alert.severity)} />
            <BlockStack gap="100">
              <Text as="h3" variant="headingMd" fontWeight="semibold">
                {alert.title}
              </Text>
              <InlineStack gap="200">
                {getSeverityBadge(alert.severity)}
                <Text as="span" variant="bodySm" tone="subdued">
                  {formatAlertType(alert.alertType)}
                </Text>
                <Text as="span" variant="bodySm" tone="subdued">
                  •
                </Text>
                <Text as="span" variant="bodySm" tone="subdued">
                  {formatRelativeTime(alert.triggeredAt)}
                </Text>
              </InlineStack>
            </BlockStack>
          </InlineStack>

          {/* Status Badge */}
          {isResolved && (
            <Badge tone="success" icon={CheckCircleIcon}>Resolved</Badge>
          )}
          {isAcknowledged && (
            <Badge tone="info">Acknowledged</Badge>
          )}
        </InlineStack>

        {/* Message */}
        <Text as="p" variant="bodyMd">
          {alert.message}
        </Text>

        {/* Notification Status */}
        <InlineStack gap="200">
          <Text as="span" variant="bodySm" tone="subdued">
            Sent via:
          </Text>
          {alert.emailSent && <Badge>Email</Badge>}
          {alert.slackSent && <Badge>Slack</Badge>}
          {alert.smsSent && <Badge>SMS</Badge>}
          {alert.inAppSent && <Badge>In-App</Badge>}
        </InlineStack>

        {/* Actions */}
        {isActive && (
          <InlineStack gap="200">
            <Button onClick={() => onAcknowledge(alert.id)}>
              Acknowledge
            </Button>
            <Button onClick={() => onResolve(alert.id)}>
              Resolve
            </Button>
          </InlineStack>
        )}

        {isAcknowledged && (
          <InlineStack gap="200">
            <Button onClick={() => onResolve(alert.id)} variant="primary">
              Resolve
            </Button>
            <Text as="span" variant="bodySm" tone="subdued">
              Acknowledged by {alert.acknowledgedBy} {formatRelativeTime(alert.acknowledgedAt!)}
            </Text>
          </InlineStack>
        )}
      </BlockStack>
    </Card>
  );
}

// ============================================================================
// Summary Stats Component
// ============================================================================

function SummaryStats({ summary }: { summary: AlertSummary }) {
  return (
    <InlineStack gap="400">
      <Card>
        <BlockStack gap="200">
          <Text as="p" variant="headingXl" fontWeight="bold">
            {summary.active}
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            Active Alerts
          </Text>
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="200">
          <Text as="p" variant="headingXl" fontWeight="bold">
            {summary.acknowledged}
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            Acknowledged
          </Text>
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="200">
          <Text as="p" variant="headingXl" fontWeight="bold">
            {summary.resolved}
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            Resolved
          </Text>
        </BlockStack>
      </Card>

      {/* Severity Breakdown */}
      <Card>
        <BlockStack gap="200">
          <Text as="p" variant="bodyMd" fontWeight="semibold">
            By Severity
          </Text>
          <BlockStack gap="100">
            {Object.entries(summary.bySeverity).map(([severity, count]) => (
              <InlineStack key={severity} align="space-between">
                <Text as="span" variant="bodySm">
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </Text>
                <Text as="span" variant="bodySm" fontWeight="semibold">
                  {count}
                </Text>
              </InlineStack>
            ))}
          </BlockStack>
        </BlockStack>
      </Card>
    </InlineStack>
  );
}

// ============================================================================
// Alert History Table Component
// ============================================================================

function AlertHistoryTable({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <Card>
        <EmptyState
          heading="No alert history"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Alert history will appear here once alerts are triggered.</p>
        </EmptyState>
      </Card>
    );
  }

  const rows = alerts.map(alert => [
    formatRelativeTime(alert.triggeredAt),
    getSeverityBadge(alert.severity),
    alert.title,
    formatAlertType(alert.alertType),
    alert.resolvedAt ? 'Resolved' : alert.acknowledged ? 'Acknowledged' : 'Active',
  ]);

  return (
    <Card>
      <DataTable
        columnContentTypes={['text', 'text', 'text', 'text', 'text']}
        headings={['Time', 'Severity', 'Title', 'Type', 'Status']}
        rows={rows}
      />
    </Card>
  );
}

// ============================================================================
// Main Alert Panel Component
// ============================================================================

export function AlertPanel({
  activeAlerts,
  alertHistory,
  summary,
  onAcknowledge,
  onResolve,
  onRefresh,
}: AlertPanelProps) {
  const hasActiveAlerts = activeAlerts.length > 0;
  const hasCriticalAlerts = activeAlerts.some(a => a.severity === 'critical');

  return (
    <BlockStack gap="400">
      {/* Critical Alert Banner */}
      {hasCriticalAlerts && (
        <Banner tone="critical">
          <p>
            <strong>Critical alerts require immediate attention!</strong> Review and acknowledge critical alerts to prevent stockouts.
          </p>
        </Banner>
      )}

      {/* Summary Stats */}
      <SummaryStats summary={summary} />

      {/* Active Alerts Section */}
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h2" variant="headingLg">
            Active Alerts
          </Text>
          <Button onClick={onRefresh}>Refresh</Button>
        </InlineStack>

        {!hasActiveAlerts ? (
          <Card>
            <EmptyState
              heading="No active alerts"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>All systems operating normally. Active alerts will appear here when triggered.</p>
            </EmptyState>
          </Card>
        ) : (
          <BlockStack gap="400">
            {activeAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={onAcknowledge}
                onResolve={onResolve}
              />
            ))}
          </BlockStack>
        )}
      </BlockStack>

      {/* Alert History Section */}
      <BlockStack gap="400">
        <Text as="h2" variant="headingLg">
          Alert History
        </Text>
        <AlertHistoryTable alerts={alertHistory} />
      </BlockStack>
    </BlockStack>
  );
}
