import { Outlet } from "@remix-run/react";

export default function InventoryLayout() {
  return (
      <div className="min-h-screen mx-2">
        <main>
          <Outlet />
        </main>
      </div>

  );
}