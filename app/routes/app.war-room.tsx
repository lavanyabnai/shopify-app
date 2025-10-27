import { Outlet } from "@remix-run/react";

/**
 * War Room Layout Route
 *
 * This is a layout route that wraps all /app/war-room/* routes.
 * Child routes will be rendered in the <Outlet /> component.
 *
 * Routes:
 * - /app/war-room (index) -> app.war-room._index.tsx - Main DEFCON dashboard
 * - /app/war-room/alerts -> app.war-room.alerts.tsx - Alerts dashboard
 * - /app/war-room/actions -> app.war-room.actions.tsx - Action center
 * - /app/war-room/simulate -> app.war-room.simulate.tsx - Simulation lab
 * - /app/war-room/roi -> app.war-room.roi.tsx - ROI & Attribution dashboard
 */
export default function WarRoomLayout() {
  return <Outlet />;
}
