/**
 * Jest Test Setup
 *
 * This file runs before all tests to configure the test environment
 */

import { PrismaClient } from '@prisma/client';

// Extend Jest timeout for database operations
jest.setTimeout(30000);

// Global test configuration
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');

  // Verify database connection
  const db = new PrismaClient();
  try {
    await db.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
});

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };
