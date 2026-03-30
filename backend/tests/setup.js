/**
 * Jest Global Test Setup
 * Uses mongodb-memory-server to spin up an in-memory MongoDB instance.
 * This means tests are completely isolated — no real DB is touched.
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// ── Stub out side-effect modules before anything imports them ────────────────

// Silence email sending during tests
jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue(true));

// Silence ImageKit (no credentials in CI)
jest.mock('../utils/imageKit', () => null);

// Silence ioredis (no Redis in CI)
jest.mock('../utils/cache', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  invalidateCache: jest.fn().mockResolvedValue(undefined),
  isConnected: () => false,
}));

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeAll(async () => {
  // Set required env vars for JWT signing etc.
  process.env.JWT_SECRET = 'test-jwt-secret-kora-apparel-ci';
  process.env.NODE_ENV = 'test';

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// Wipe all collections between test files
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
