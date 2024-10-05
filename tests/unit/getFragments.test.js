// tests/unit/getFragment.test.js

const request = require('supertest');
const app = require('../../src/app'); // Path to your Express app

// Test credentials
const userEmail = 'user1@email.com';
const password = 'password1';

describe('GET /v1/fragments', () => {
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth(userEmail, password); // Authenticating with valid credentials

    // Expect a successful response
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true); // Ensure fragments is an array
  });
});

// Fragment metadata
const fragment = {
  ownerId: userEmail,
  type: 'text/plain',
};

// Test data
const testData = Buffer.from('Doggies for life!');

describe('GET /v1/fragments/:id', () => {
  let fragmentId;

  // Create a fragment before each test
  beforeEach(async () => {
    const resPost = await request(app)
      .post('/v1/fragments')
      .auth(userEmail, password) // Basic Auth credentials
      .set('Content-Type', fragment.type)
      .send(testData);

    // Successful
    expect(resPost.statusCode).toBe(201);
    expect(resPost.body).toHaveProperty('fragment');

    // Store the fragmentId for use in tests
    fragmentId = resPost.body.fragment.id;
    expect(fragmentId).toBeDefined(); // Check that the fragment ID was returned
  });

  // authenticated users get a specific fragment by ID
  test('authenticated users get a specific fragment by ID', async () => {
    const res = await request(app).get(`/v1/fragments/${fragmentId}`).auth(userEmail, password);

    // Expect a successful response
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toBeDefined();
    expect(res.body.fragment.id).toEqual(fragmentId);
  });

  test('authenticated users gets an error for a wrong fragment', async () => {
    const res = await request(app).get(`/v1/fragments/1234`).auth(userEmail, password);

    // Expect a bad request
    expect(res.statusCode).toBe(404);
  });
});
