/**
 * Standalone Production Server
 *
 * Simple Express server to run the production build
 * without Shopify CLI dependencies
 */

const path = require('path');
const express = require('express');
const { createRequestHandler } = require('@remix-run/express');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets
app.use(express.static('build/client', {
  maxAge: '1y',
  immutable: true
}));

// Handle all requests with Remix
app.all('*', createRequestHandler({
  build: require('./build/server/index.js'),
  mode: process.env.NODE_ENV || 'production'
}));

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  🟢 BFCM War Room - Production Server Running        ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  🌐 Dashboard URL: http://localhost:${PORT}/app/war-room`);
  console.log('');
  console.log('  📊 All Dashboards:');
  console.log(`     • Main:        http://localhost:${PORT}/app/war-room`);
  console.log(`     • Alerts:      http://localhost:${PORT}/app/war-room/alerts`);
  console.log(`     • Actions:     http://localhost:${PORT}/app/war-room/actions`);
  console.log(`     • Simulations: http://localhost:${PORT}/app/war-room/simulate`);
  console.log(`     • ROI Tracker: http://localhost:${PORT}/app/war-room/roi`);
  console.log('');
  console.log('  ✅ Server ready for connections');
  console.log('  ⏹️  Press Ctrl+C to stop');
  console.log('');
});
