let redis;
let client;
let isConnected = false;

try {
  redis = require('redis');
  client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      connectTimeout: 2000,
      reconnectStrategy: false,
    }
  });

  client.on('error', (err) => {
    // console.warn('Redis connection failed or lost. Caching bypassed.');
    isConnected = false;
  });

  client.on('connect', () => {
    console.log('✅ Redis Cache connected');
    isConnected = true;
  });

  // Try to connect, catch error silently if Redis is not installed
  client.connect().catch(() => {
    isConnected = false;
  });
} catch (e) {
  isConnected = false;
}

/**
 * Get data from cache
 * @param {string} key 
 */
const getCache = async (key) => {
  if (!isConnected) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
};

/**
 * Set data in cache
 * @param {string} key 
 * @param {any} data 
 * @param {number} expiration in seconds (default 3600)
 */
const setCache = async (key, data, expiration = 3600) => {
  if (!isConnected) return;
  try {
    await client.setEx(key, expiration, JSON.stringify(data));
  } catch (err) { }
};

/**
 * Invalidate cache by key or pattern
 * @param {string} key 
 */
const invalidateCache = async (key) => {
  if (!isConnected) return;
  try {
    await client.del(key);
  } catch (err) { }
};

module.exports = {
  getCache,
  setCache,
  invalidateCache,
  isConnected: () => isConnected,
};
