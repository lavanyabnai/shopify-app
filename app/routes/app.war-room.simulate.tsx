/**
 * Simulation Lab Route (Session 7)
 *
 * Interactive simulation interface for what-if scenario modeling
 */

import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useRevalidator } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Page, Layout, Card, Banner } from "@shopify/polaris";
import { SimulationLab } from "../components/SimulationLab";
import {
  createSimulation,
  runSimulation,
  listSimulations,
  deleteSimulation,
  type ScenarioType,
  type SimulationParameters,
} from "../services/simulation-engine.server";
import {
  listPlaybooks,
  executePlaybook,
  createDefaultPlaybooks,
} from "../services/playbook-manager.server";

// ============================================================================
// Loader
// ============================================================================

interface LoaderData {
  shop: string;
  simulations: any[];
  playbooks: any[];
  error?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    // Fetch simulations and playbooks
    const [simulations, playbooks] = await Promise.all([
      listSimulations(shop, 50),
      listPlaybooks(shop),
    ]);

    // If no playbooks exist, create defaults
    if (playbooks.length === 0) {
      console.log("📘 No playbooks found, creating defaults...");
      await createDefaultPlaybooks(shop);
      const newPlaybooks = await listPlaybooks(shop);
      return json<LoaderData>({
        shop,
        simulations,
        playbooks: newPlaybooks,
      });
    }

    return json<LoaderData>({
      shop,
      simulations,
      playbooks,
    });
  } catch (error: any) {
    console.error("❌ Error loading simulation lab:", error);
    return json<LoaderData>({
      shop,
      simulations: [],
      playbooks: [],
      error: error.message,
    });
  }
}

// ============================================================================
// Action
// ============================================================================

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const formData = await request.formData();
  const actionType = formData.get("action") as string;

  try {
    switch (actionType) {
      case "run_simulation": {
        const name = formData.get("name") as string;
        const scenario = formData.get("scenario") as ScenarioType;
        const parameters = JSON.parse(
          formData.get("parameters") as string
        ) as SimulationParameters;

        console.log(`🎮 Creating simulation: ${name} (${scenario})`);

        // Create simulation
        const simulation = await createSimulation(shop, name, scenario, parameters);

        // Run simulation asynchronously (don't await to avoid timeout)
        runSimulation(simulation.id).catch((error) => {
          console.error(`❌ Simulation ${simulation.id} failed:`, error);
        });

        return json({ success: true, simulationId: simulation.id });
      }

      case "delete_simulation": {
        const simulationId = formData.get("simulationId") as string;
        await deleteSimulation(simulationId);
        return json({ success: true });
      }

      case "execute_playbook": {
        const playbookId = formData.get("playbookId") as string;
        console.log(`📘 Executing playbook: ${playbookId}`);

        const result = await executePlaybook(playbookId);

        return json({
          success: true,
          playbook: result.playbook,
          actions: result.actions,
          executionPlan: result.executionPlan,
        });
      }

      default:
        return json({ success: false, error: "Unknown action type" }, { status: 400 });
    }
  } catch (error: any) {
    console.error(`❌ Action error (${actionType}):`, error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

// ============================================================================
// Component
// ============================================================================

export default function SimulationLabRoute() {
  const { shop, simulations, playbooks, error } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  const handleRunSimulation = async (
    name: string,
    scenario: ScenarioType,
    parameters: SimulationParameters
  ) => {
    const formData = new FormData();
    formData.append("action", "run_simulation");
    formData.append("name", name);
    formData.append("scenario", scenario);
    formData.append("parameters", JSON.stringify(parameters));

    const response = await fetch("/app/war-room/simulate", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to run simulation");
    }

    // Revalidate to show the new simulation
    revalidator.revalidate();

    // Show success message
    alert(
      `Simulation "${name}" started! It will appear in the history tab when complete (usually <10 seconds).`
    );
  };

  const handleDeleteSimulation = async (simulationId: string) => {
    const formData = new FormData();
    formData.append("action", "delete_simulation");
    formData.append("simulationId", simulationId);

    const response = await fetch("/app/war-room/simulate", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to delete simulation");
    }

    revalidator.revalidate();
  };

  const handleViewSimulation = (simulationId: string) => {
    // For now, just show an alert (could navigate to detail page in future)
    const sim = simulations.find((s) => s.id === simulationId);
    if (!sim) return;

    const resultsText = sim.results
      .map(
        (r: any) =>
          `\n${r.category.toUpperCase()}\nImpact: ${r.impactScore.toFixed(1)}\nSeverity: ${r.severity}\nRecommendations: ${r.recommendations.length}`
      )
      .join("\n");

    alert(
      `Simulation: ${sim.name}\nScenario: ${sim.scenario}\nStatus: ${sim.status}\nImpact Score: ${sim.impactScore?.toFixed(1) || "N/A"}\nRisk Level: ${sim.riskLevel || "N/A"}\n\nResults:${resultsText}`
    );
  };

  const handleExecutePlaybook = async (playbookId: string) => {
    const formData = new FormData();
    formData.append("action", "execute_playbook");
    formData.append("playbookId", playbookId);

    const response = await fetch("/app/war-room/simulate", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to execute playbook");
    }

    // Show execution plan
    alert(`Playbook Executed!\n\n${result.executionPlan}`);

    revalidator.revalidate();
  };

  const handleRefresh = () => {
    revalidator.revalidate();
  };

  return (
    <Page
      title="Simulation Lab"
      subtitle={`What-if scenario modeling for ${shop}`}
      backAction={{
        content: "War Room",
        onAction: () => navigate("/app/war-room"),
      }}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" title="Error loading simulation lab">
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <SimulationLab
            simulations={simulations}
            playbooks={playbooks}
            onRunSimulation={handleRunSimulation}
            onDeleteSimulation={handleDeleteSimulation}
            onViewSimulation={handleViewSimulation}
            onExecutePlaybook={handleExecutePlaybook}
            onRefresh={handleRefresh}
          />
        </Layout.Section>

        {/* Info Cards */}
        <Layout.Section>
          <Card>
            <div style={{ padding: "16px" }}>
              <div style={{ marginBottom: "16px" }}>
                <strong>What are simulations?</strong>
              </div>
              <p style={{ marginBottom: "12px" }}>
                Simulations model potential scenarios to help you prepare for various
                situations like flash sales, traffic spikes, supplier delays, and more.
              </p>
              <p style={{ marginBottom: "12px" }}>
                Each simulation provides:
              </p>
              <ul style={{ marginLeft: "20px", marginBottom: "12px" }}>
                <li>Impact assessment across inventory, revenue, and fulfillment</li>
                <li>Predicted outcomes with confidence scores</li>
                <li>AI-powered recommendations with priority rankings</li>
                <li>Comparison with baseline metrics</li>
              </ul>
              <p>
                <strong>Performance:</strong> Most simulations complete in under 10
                seconds.
              </p>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: "16px" }}>
              <div style={{ marginBottom: "16px" }}>
                <strong>What are playbooks?</strong>
              </div>
              <p style={{ marginBottom: "12px" }}>
                Playbooks are pre-configured action plans for common scenarios. They
                contain:
              </p>
              <ul style={{ marginLeft: "20px", marginBottom: "12px" }}>
                <li>Trigger conditions (when to activate)</li>
                <li>Ordered action sequences</li>
                <li>Priority and urgency settings</li>
                <li>Success criteria</li>
              </ul>
              <p style={{ marginBottom: "12px" }}>
                Playbooks can be executed manually or automatically when trigger
                conditions are met. They help ensure consistent responses to critical
                situations.
              </p>
              <p>
                <strong>Default playbooks:</strong> 5 playbooks created automatically
                for DEFCON 1, flash sales, stockouts, supplier delays, and competitor
                opportunities.
              </p>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
