/**
 * Orders API Tests — Jest + Supertest
 *
 * Covers:
 *  - Auth gates (all order endpoints require a token)
 *  - Stock validation before accepting payment
 *  - GET /api/orders/my — user sees own orders
 *  - Admin-only endpoint gates
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const app = require('../app');

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createVerifiedUser(email = 'buyer@orders.test', password = 'BuyerPass123!') {
  return User.create({ name: 'Buyer', email, password, role: 'user', isVerified: true });
}

async function getUserToken(email = 'buyer@orders.test', password = 'BuyerPass123!') {
  await createVerifiedUser(email, password);
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

async function createProduct(stockQty = 10) {
  return Product.create({
    name: 'Stock Tee',
    slug: `stock-tee-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    description: 'A tee for stock tests',
    price: 799,
    category: 'T-Shirts',
    stock: stockQty,
    isActive: true,
  });
}

async function enableCOD() {
  return Setting.create({ isCodEnabled: true });
}

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/orders/create-razorpay-order (auth gate)', () => {
  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/orders/create-razorpay-order')
      .send({ amount: 500, items: [] });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/orders/create-razorpay-order — stock validation', () => {
  it('returns 400 when product stock is insufficient', async () => {
    const token = await getUserToken('stocktest@orders.test');
    const product = await createProduct(2); // only 2 in stock

    const res = await request(app)
      .post('/api/orders/create-razorpay-order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 1000,
        items: [{ product: product._id, name: product.name, qty: 5, size: 'M', color: 'Black' }],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient stock/i);
  });

  it('returns 400 when product no longer exists', async () => {
    const token = await getUserToken('goneproduct@orders.test');
    const fakeProductId = '64f000000000000000000000';

    const res = await request(app)
      .post('/api/orders/create-razorpay-order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 1000,
        items: [{ product: fakeProductId, name: 'Ghost Product', qty: 1 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no longer exists/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/orders/place-cod-order', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/orders/place-cod-order').send({});
    expect(res.status).toBe(401);
  });

  it('returns 400 when COD is disabled in settings', async () => {
    // Don't create a Setting doc — defaults to no settings = COD disabled
    const token = await getUserToken('codtest@orders.test');
    const product = await createProduct(10);

    const res = await request(app)
      .post('/api/orders/place-cod-order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ product: product._id, name: 'Test', qty: 1, price: 799 }],
        shippingAddress: { name: 'Test', address: '123 St', city: 'Delhi', pincode: '110001', phone: '9999999999' },
        itemsTotal: 799,
        shippingCost: 0,
        total: 799,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cash on delivery.*disabled/i);
  });

  it('returns 400 when stock is insufficient for COD', async () => {
    await enableCOD();
    const token = await getUserToken('codstock@orders.test');
    const product = await createProduct(1); // only 1

    const res = await request(app)
      .post('/api/orders/place-cod-order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ product: product._id, name: product.name, qty: 5, price: 799 }],
        shippingAddress: { name: 'Buyer', address: '123 St', city: 'Mumbai', pincode: '400001', phone: '9000000000' },
        itemsTotal: 3995,
        shippingCost: 0,
        total: 3995,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient stock/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/orders/my', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/orders/my');
    expect(res.status).toBe(401);
  });

  it('returns empty orders array for a new user', async () => {
    const token = await getUserToken('newbuyer@orders.test');
    const res = await request(app)
      .get('/api/orders/my')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/orders (admin only)', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('returns 403 for regular user', async () => {
    const token = await getUserToken('regularfororders@orders.test');
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
