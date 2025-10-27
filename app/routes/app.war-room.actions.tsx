import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  Banner,
  Button,
  Modal,
  TextField,
  BlockStack,
} from "@shopify/polaris";
import { useState } from "react";
import ActionCenter from "../components/ActionCenter";
import {
  generateRecommendations,
  getPendingRecommendations,
  saveRecommendations,
  getRecommendationsSummary,
} from "../services/recommendation-engine.server";
import {
  executeAction,
  rollbackAction,
  getRecentExecutions,
} from "../services/action-executor.server";
import db from "../db.server";

interface LoaderData {
  shop: string;
  pendingActions: any[];
  recentExecutions: any[];
  summary: any;
}

/**
 * LOADER - Fetch pending actions and execution history
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Fetch pending recommendations and recent executions
  const [pendingActions, recentExecutions, summary] = await Promise.all([
    getPendingRecommendations(shop),
    getRecentExecutions(shop, 20),
    getRecommendationsSummary(shop),
  ]);

  return json({
    shop,
    pendingActions,
    recentExecutions,
    summary,
  });
}

/**
 * ACTION - Handle action execution, dismissal, and rollback
 */
export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const intent = formData.get("intent");
  const actionId = formData.get("actionId") as string;
  const executionId = formData.get("executionId") as string;
  const reason = formData.get("reason") as string;

  if (intent === "execute") {
    // Execute action in sandbox mode (for now)
    const result = await executeAction(
      actionId,
      session.email || "system",
      admin,
      true // Sandbox mode
    );

    return json({
      success: result.success,
      message: result.message,
    });
  }

  if (intent === "dismiss") {
    // Mark action as dismissed
    await db.recommendedAction.update({
      where: { id: actionId },
      data: { status: "dismissed" },
    });

    return json({
      success: true,
      message: "Action dismissed",
    });
  }

  if (intent === "rollback") {
    // Rollback executed action
    const result = await rollbackAction(
      executionId,
      reason || "Manual rollback",
      session.email || "system",
      admin,
      true // Sandbox mode
    );

    return json({
      success: result.success,
      message: result.message,
    });
  }

  if (intent === "refresh") {
    // Regenerate recommendations
    const newRecommendations = await generateRecommendations(shop);
    await saveRecommendations(newRecommendations);

    return json({
      success: true,
      message: `Generated ${newRecommendations.length} new recommendations`,
    });
  }

  return json({ success: false, message: "Unknown intent" });
}

/**
 * Action Center Page
 */
export default function WarRoomActionsPage() {
  const { shop, pendingActions, recentExecutions, summary } =
    useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [isExecuting, setIsExecuting] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string>("");
  const [rollbackReason, setRollbackReason] = useState("");

  const handleExecute = async (actionId: string) => {
    setIsExecuting(true);
    const formData = new FormData();
    formData.append("intent", "execute");
    formData.append("actionId", actionId);
    submit(formData, { method: "post" });
    setTimeout(() => setIsExecuting(false), 2000);
  };

  const handleDismiss = async (actionId: string) => {
    const formData = new FormData();
    formData.append("intent", "dismiss");
    formData.append("actionId", actionId);
    submit(formData, { method: "post" });
  };

  const handleRollback = (executionId: string) => {
    setSelectedExecutionId(executionId);
    setShowRollbackModal(true);
  };

  const confirmRollback = () => {
    setIsExecuting(true);
    const formData = new FormData();
    formData.append("intent", "rollback");
    formData.append("executionId", selectedExecutionId);
    formData.append("reason", rollbackReason);
    submit(formData, { method: "post" });
    setShowRollbackModal(false);
    setRollbackReason("");
    setTimeout(() => setIsExecuting(false), 2000);
  };

  const handleRefreshRecommendations = () => {
    const formData = new FormData();
    formData.append("intent", "refresh");
    submit(formData, { method: "post" });
  };

  return (
    <Page
      title="Action Center"
      subtitle={`Prescriptive recommendations for ${shop}`}
      primaryAction={{
        content: "Refresh Recommendations",
        onAction: handleRefreshRecommendations,
      }}
      secondaryActions={[
        {
          content: "Back to War Room",
          onAction: () => navigate("/app/war-room"),
        },
      ]}
    >
      <Layout>
        {/* Sandbox Mode Warning */}
        <Layout.Section>
          <Banner tone="info">
            <p>
              <strong>Sandbox Mode:</strong> All actions are simulated and will
              not make actual changes to your Shopify store. This is a safe
              environment for testing recommendations.
            </p>
          </Banner>
        </Layout.Section>

        {/* Action Center */}
        <Layout.Section>
          <ActionCenter
            pendingActions={pendingActions}
            recentExecutions={recentExecutions}
            onExecute={handleExecute}
            onDismiss={handleDismiss}
            onRollback={handleRollback}
            isExecuting={isExecuting}
          />
        </Layout.Section>

        {/* Rollback Modal */}
        {showRollbackModal && (
          <Modal
            open={showRollbackModal}
            onClose={() => setShowRollbackModal(false)}
            title="Confirm Rollback"
            primaryAction={{
              content: "Rollback Action",
              onAction: confirmRollback,
              destructive: true,
            }}
            secondaryActions={[
              {
                content: "Cancel",
                onAction: () => setShowRollbackModal(false),
              },
            ]}
          >
            <Modal.Section>
              <BlockStack gap="400">
                <p>
                  Are you sure you want to rollback this action? This will
                  reverse the changes made.
                </p>
                <TextField
                  label="Reason for rollback (optional)"
                  value={rollbackReason}
                  onChange={setRollbackReason}
                  multiline={3}
                  autoComplete="off"
                />
              </BlockStack>
            </Modal.Section>
          </Modal>
        )}
      </Layout>
    </Page>
  );
}
