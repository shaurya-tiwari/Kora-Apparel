/**
 * Coupons API Tests — Jest + Supertest
 *
 * Tests the public /validate endpoint with all its business logic branches:
 *  - Invalid/inactive coupon
 *  - Expired coupon
 *  - Usage limit reached
 *  - Minimum purchase not met
 *  - Percentage discount calculation
 *  - Flat discount calculation
 *  - Discount capped at subtotal (no negative totals)
 */

const request = require('supertest');
const Coupon = require('../models/Coupon');
const app = require('../app');

// ── Helper ─────────────────────────────────────────────────────────────────────
function futureDate(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function pastDate(days = 1) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function createCoupon(overrides = {}) {
  return Coupon.create({
    code: `TEST${Date.now()}`,
    discountType: 'percentage',
    discountValue: 10,
    expiryDate: futureDate(),
    isActive: true,
    minPurchase: 0,
    usageLimit: 0,
    usedCount: 0,
    ...overrides,
  });
}

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/coupons/validate', () => {
  it('returns 404 for non-existent coupon code', async () => {
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'FAKECODE999', subtotal: 1000 });
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/invalid or inactive/i);
  });

  it('returns 404 for an inactive coupon', async () => {
    await createCoupon({ code: 'INACTIVE10', isActive: false });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'INACTIVE10', subtotal: 1000 });
    expect(res.status).toBe(404);
  });

  it('returns 400 for an expired coupon', async () => {
    await createCoupon({ code: 'EXPIRED10', expiryDate: pastDate(2) });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'EXPIRED10', subtotal: 1000 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  it('returns 400 when usage limit is reached', async () => {
    await createCoupon({ code: 'MAXED10', usageLimit: 5, usedCount: 5 });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'MAXED10', subtotal: 1000 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/usage limit reached/i);
  });

  it('returns 400 when subtotal is below minimum purchase', async () => {
    await createCoupon({ code: 'MINPURCH', minPurchase: 2000 });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'MINPURCH', subtotal: 500 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/minimum purchase/i);
  });

  it('calculates percentage discount correctly', async () => {
    await createCoupon({ code: 'SAVE20', discountType: 'percentage', discountValue: 20 });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'SAVE20', subtotal: 1000 });
    expect(res.status).toBe(200);
    expect(res.body.discountAmount).toBe(200); // 20% of 1000
    expect(res.body.code).toBe('SAVE20');
  });

  it('calculates flat discount correctly', async () => {
    await createCoupon({ code: 'FLAT150', discountType: 'flat', discountValue: 150 });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'FLAT150', subtotal: 1000 });
    expect(res.status).toBe(200);
    expect(res.body.discountAmount).toBe(150);
  });

  it('caps discount at subtotal (prevents negative total)', async () => {
    await createCoupon({ code: 'BIGFLAT', discountType: 'flat', discountValue: 5000 });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'BIGFLAT', subtotal: 100 });
    expect(res.status).toBe(200);
    expect(res.body.discountAmount).toBe(100); // capped at subtotal
  });

  it('is case-insensitive (accepts lowercase code)', async () => {
    await createCoupon({ code: 'UPPER10', discountType: 'flat', discountValue: 50 });
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'upper10', subtotal: 500 });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe('UPPER10');
  });
});
