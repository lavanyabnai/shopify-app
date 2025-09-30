
import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/service">Service Dashboard</Link>
        <Link to="/app/sku">SKU Dashboard</Link>
        <Link to="/app/skuviews">SKU Views</Link>
        <Link to="/app/action-shape">Action: Shape Demand</Link>
        <Link to="/app/action-redeploy">Action: Redeploy Stock</Link>
        <Link to="/app/action-supply">Action: Increase Supply</Link>
        <Link to="/app/issue-excess">Issues: Excess Inventory</Link>
        <Link to="/app/analytics">Analytics Dashboard</Link>
        <Link to="/app/orders">Orders</Link>
        <Link to="/app/qrcodes">QR Codes</Link>
        <Link to="/app/control-tower">Control Tower</Link>
        <Link to="/app/additional">Additional page</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
}










// import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
// import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
// import { boundary } from "@shopify/shopify-app-remix/server";
// import { AppProvider } from "@shopify/shopify-app-remix/react";
// import { NavMenu } from "@shopify/app-bridge-react";
// import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

// import { authenticate } from "../shopify.server";

// export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

// export const loader = async ({ request }: LoaderFunctionArgs) => {
//   await authenticate.admin(request);

//   return { apiKey: process.env.SHOPIFY_API_KEY || "" };
// };

// export default function App() {
//   const { apiKey } = useLoaderData<typeof loader>();

//   return (
//     <AppProvider isEmbeddedApp apiKey={apiKey}>
//       <NavMenu>
//         <Link to="/app" rel="home">
//           Home
//         </Link>
//         <Link to="/app/additional">Additional page</Link>
//       </NavMenu>
//       <Outlet />
//     </AppProvider>
//   );
// }

// // Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
// export function ErrorBoundary() {
//   return boundary.error(useRouteError());
// }

// export const headers: HeadersFunction = (headersArgs) => {
//   return boundary.headers(headersArgs);
// };
