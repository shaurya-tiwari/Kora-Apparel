/**
 * Auth API Tests — Jest + Supertest
 * 
 * Tests the full auth flow:
 *  - Validation errors (missing fields)
 *  - OTP send endpoint (email is mocked, just tests the API contract)
 *  - Admin login with wrong credentials
 *  - Protected route rejects unauthenticated requests
 *  - Full password login flow with real in-memory DB user
 */

const request = require('supertest');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const app = require('../app');

// ── Helper: create a verified user directly in the DB ─────────────────────────
async function createUser({ email, password, role = 'user', isVerified = true } = {}) {
  return User.create({ name: 'Test User', email, password, role, isVerified });
}

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nope@test.com' }); // missing name + password
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 200 and sends OTP when all fields provided', async () => {
    // sendEmail is mocked in setup.js; this tests the API contract only
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Shaurya', email: 'shaurya@kora.test', password: 'Secret123!' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/verification code sent/i);
  });

  it('returns 400 when user already exists', async () => {
    await createUser({ email: 'exists@kora.test', password: 'Secret123!' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dup', email: 'exists@kora.test', password: 'Secret123!' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns 400 when credentials are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@kora.test' }); // no password
    expect(res.status).toBe(400);
  });

  it('returns 401 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@kora.test', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for wrong password', async () => {
    await createUser({ email: 'real@kora.test', password: 'CorrectPass1!' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'real@kora.test', password: 'WrongPass!' });
    expect(res.status).toBe(401);
  });

  it('returns token + user on successful login', async () => {
    await createUser({ email: 'success@kora.test', password: 'MyPass123!' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'success@kora.test', password: 'MyPass123!' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.email).toBe('success@kora.test');
    expect(res.body).not.toHaveProperty('password'); // never expose password
  });

  it('returns 403 for blocked user', async () => {
    const user = await createUser({ email: 'blocked@kora.test', password: 'Pass123!' });
    user.isBlocked = true;
    await user.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'blocked@kora.test', password: 'Pass123!' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/blocked/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/admin/login', () => {
  it('returns 401 for non-admin user', async () => {
    await createUser({ email: 'user@kora.test', password: 'Pass123!', role: 'user' });
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({ email: 'user@kora.test', password: 'Pass123!' });
    expect(res.status).toBe(401);
  });

  it('returns token for valid admin credentials', async () => {
    await createUser({ email: 'admin@kora.test', password: 'AdminPass123!', role: 'admin' });
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({ email: 'admin@kora.test', password: 'AdminPass123!' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.role).toBe('admin');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/auth/me (protected)', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with garbage token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid token', async () => {
    await createUser({ email: 'me@kora.test', password: 'Pass123!' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'me@kora.test', password: 'Pass123!' });

    const { token } = loginRes.body;
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@kora.test');
    expect(res.body).not.toHaveProperty('password');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/send-otp', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/send-otp').send({});
    expect(res.status).toBe(400);
  });

  it('returns 200 and sends OTP for any email', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ email: 'otp-test@kora.test' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/verification code sent/i);
  });
});
