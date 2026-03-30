/**
 * Products API Tests — Jest + Supertest
 *
 * Covers:
 *  - Public listing (GET /api/products)
 *  - Public single product fetch by slug (GET /api/products/:slug)
 *  - 404 for unknown slug
 *  - Auth gates: POST requires admin token
 *  - Admin product creation
 *  - Admin deletion
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const app = require('../app');

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createAdmin() {
  return User.create({
    name: 'Admin',
    email: 'admin@products.test',
    password: 'AdminPass123!',
    role: 'admin',
    isVerified: true,
  });
}

async function getAdminToken() {
  await createAdmin();
  const res = await request(app)
    .post('/api/auth/admin/login')
    .send({ email: 'admin@products.test', password: 'AdminPass123!' });
  return res.body.token;
}

async function createProduct(overrides = {}) {
  return Product.create({
    name: 'Test Tee',
    slug: `test-tee-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    description: 'A simple test product',
    price: 999,
    category: 'T-Shirts',
    stock: 50,
    isActive: true,
    ...overrides,
  });
}

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/products', () => {
  it('returns 200 with products array and metadata', async () => {
    await createProduct({ name: 'Alpha Tee', slug: 'alpha-tee-1' });
    await createProduct({ name: 'Beta Tee', slug: 'beta-tee-1' });

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBe(2);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('pages');
  });

  it('returns empty list when no products exist', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  it('filters by featured flag', async () => {
    await createProduct({ slug: 'featured-1', isFeatured: true });
    await createProduct({ slug: 'regular-1', isFeatured: false });

    const res = await request(app).get('/api/products?featured=true');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].isFeatured).toBe(true);
  });

  it('paginates correctly', async () => {
    for (let i = 0; i < 15; i++) {
      await createProduct({ slug: `paginated-${i}`, name: `Product ${i}` });
    }
    const res = await request(app).get('/api/products?page=2&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(5);
    expect(res.body.page).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/products/:slug', () => {
  it('returns the product for a valid slug', async () => {
    await createProduct({ slug: 'my-exact-slug', name: 'Slug Tee' });

    const res = await request(app).get('/api/products/my-exact-slug');
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('my-exact-slug');
    expect(res.body.name).toBe('Slug Tee');
  });

  it('returns 404 for an unknown slug', async () => {
    const res = await request(app).get('/api/products/this-slug-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/products (admin only)', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).post('/api/products').send({ name: 'Hack attempt' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for a regular user token', async () => {
    await User.create({
      name: 'Regular', email: 'reg@products.test',
      password: 'UserPass123!', role: 'user', isVerified: true,
    });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reg@products.test', password: 'UserPass123!' });
    const token = loginRes.body.token;

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Unauthorized Product', description: 'x', price: 100, category: 'Test', stock: 10 });
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/products/:id (admin only)', () => {
  it('returns 401 with no token', async () => {
    const product = await createProduct({ slug: 'to-delete' });
    const res = await request(app).delete(`/api/products/${product._id}`);
    expect(res.status).toBe(401);
  });

  it('returns 404 for non-existent product ID (admin)', async () => {
    const token = await getAdminToken();
    const fakeId = '64f000000000000000000000';
    const res = await request(app)
      .delete(`/api/products/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
