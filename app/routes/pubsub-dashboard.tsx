/**
 * Pub/Sub Dashboard for Control Tower
 * 
 * Real-time dashboard showing:
 * - Channel status and subscriber counts
 * - Recent messages
 * - System health
 * - Pub/Sub URL pattern: redis-pubsub://{shop-webhooks}:{control-tower}
 */

import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";

interface ChannelInfo {
  subscribers: number;
  channel: string;
}

interface PubSubData {
  success: boolean;
  pubSubUrl: string;
  channels: {
    shopWebhooks: ChannelInfo;
    controlTower: ChannelInfo;
    inventoryAlerts: ChannelInfo;
    inventoryUpdates: ChannelInfo;
  };
  timestamp: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const response = await fetch(`${new URL(request.url).origin}/api/pubsub`);
    const data = await response.json();
    return json(data);
  } catch (error) {
    console.error("Error loading pub/sub data:", error);
    return json({
      success: false,
      error: "Failed to load pub/sub data",
      channels: {
        shopWebhooks: { subscribers: 0, channel: "shop-webhooks" },
        controlTower: { subscribers: 0, channel: "control-tower" },
        inventoryAlerts: { subscribers: 0, channel: "inventory_alerts" },
        inventoryUpdates: { subscribers: 0, channel: "inventory_updates" }
      },
      pubSubUrl: "redis-pubsub://shop-webhooks:control-tower"
    });
  }
};

export default function PubSubDashboard() {
  const data = useLoaderData<PubSubData>();
  const fetcher = useFetcher();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    fetcher.load("/api/pubsub");
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const channels = [
    {
      name: "Shop Webhooks",
      info: data.channels.shopWebhooks,
      description: "Webhook events from Shopify stores",
      color: "bg-blue-500"
    },
    {
      name: "Control Tower",
      info: data.channels.controlTower,
      description: "Internal app communication and alerts",
      color: "bg-green-500"
    },
    {
      name: "Inventory Alerts",
      info: data.channels.inventoryAlerts,
      description: "Real-time inventory alerts and notifications",
      color: "bg-yellow-500"
    },
    {
      name: "Inventory Updates",
      info: data.channels.inventoryUpdates,
      description: "Inventory level changes and updates",
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pub/Sub Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Real-time monitoring of Control Tower messaging system
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900">Pub/Sub URL Pattern</h3>
            <code className="text-blue-800 font-mono text-lg">{data.pubSubUrl}</code>
            <p className="text-blue-700 text-sm mt-1">
              Format: redis-pubsub://{`{shop-webhooks}:{control-tower}`}
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mb-6">
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </button>
          <span className="ml-4 text-sm text-gray-600">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </span>
        </div>

        {/* Channel Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {channels.map((channel, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{channel.name}</h3>
                <div className={`w-3 h-3 rounded-full ${channel.color}`}></div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subscribers:</span>
                  <span className="font-semibold text-gray-900">
                    {channel.info.subscribers}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Channel:</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {channel.info.channel}
                  </code>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-3">{channel.description}</p>
            </div>
          ))}
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.success ? "✓" : "✗"}
              </div>
              <p className="text-gray-600">Connection Status</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {channels.reduce((sum, ch) => sum + ch.info.subscribers, 0)}
              </div>
              <p className="text-gray-600">Total Subscribers</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">4</div>
              <p className="text-gray-600">Active Channels</p>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Examples</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Publish Webhook Event</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`POST /api/pubsub
{
  "action": "publish_webhook",
  "message": {
    "shop": "example-shop.myshopify.com",
    "topic": "orders/create",
    "payload": { "order": {...} }
  }
}`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Publish Control Tower Message</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`POST /api/pubsub
{
  "action": "publish_control_tower",
  "message": {
    "type": "alert",
    "data": { "message": "System alert" }
  }
}`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Publish Inventory Update</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`POST /api/pubsub
{
  "action": "publish_inventory_update",
  "message": {
    "sku": "PROD-001",
    "locationId": "LOC-001",
    "quantity": 50
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
