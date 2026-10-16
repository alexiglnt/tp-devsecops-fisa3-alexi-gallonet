const request = require('supertest');
const app = require('../src/app');

describe('health check', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('auth', () => {
  it('rejects login with wrong credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'nope', password: 'nope' });
    expect(res.statusCode).toBe(401);
  });

  it('registers a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ username: `user_${Date.now()}`, password: 'test1234' });
    expect(res.statusCode).toBe(201);
  });
});
