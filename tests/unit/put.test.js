const request = require('supertest');
const app = require('../../src/app');
const hashEmail = require('../../src/hash');
// Testing credentials
const userEmail = 'user1@email.com';
const password = 'password1';

const badUserEmail = 'bad@email.com';
const badPassword = 'bad';

// Helper function for authenticated POST requests to create fragments
const authPostTest = async (email, password, contentType, ownerId, testData) => {
  return request(app)
    .post('/v1/fragments')
    .auth(email, password)
    .set('content-type', contentType)
    .send(testData);
};

// Fragment metadata
const fragment = {
  ownerId: hashEmail(userEmail), // Ensure `hashEmail` is defined or mocked
  type: 'text/plain',
};

// Test data
const testData = 'Doggies for life!';

describe('PUT /v1/fragments/:id', () => {
  let createdFragmentId;

  beforeAll(async () => {
    // Create a fragment for testing updates using authPostTest
    const postResponse = await authPostTest(
      userEmail,
      password,
      fragment.type,
      fragment.ownerId,
      testData
    );

    // Check that the fragment was created successfully
    expect(postResponse.statusCode).toBe(201);
    expect(postResponse.body).toHaveProperty('fragment');
    createdFragmentId = postResponse.body.fragment.id;
  });

  afterAll(async () => {
    // Clean up test data
    await request(app).delete(`/v1/fragments/${createdFragmentId}`).auth(userEmail, password);
  });

  test('unauthenticated requests are denied', async () => {
    const res = await request(app).put('/v1/fragments/id');
    expect(res.statusCode).toBe(401);
  });

  test('incorrect credentials are denied', async () => {
    const res = await request(app).put('/v1/fragments/id').auth(badUserEmail, badPassword);
    expect(res.statusCode).toBe(401);
  });

  test('A fragment can be updated with the same type of content', async () => {
    const newText = 'Dogs are not our whole life, but they make our lives whole.';
    const res = await request(app)
      .put(`/v1/fragments/${createdFragmentId}`)
      .auth(userEmail, password)
      .set('content-type', 'text/plain')
      .send(newText);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.size).toBe(newText.length);
    expect(res.body.fragment.created).not.toEqual(res.body.fragment.updated);
  });

  test('A fragment cannot be updated when requested content type is different', async () => {
    const res = await request(app)
      .put(`/v1/fragments/${createdFragmentId}`)
      .auth(userEmail, password)
      .set('content-type', 'text/markdown')
      .send('# Bubbles the best dog ever!');

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  test('A non-existent fragment cannot be updated', async () => {
    const res = await request(app)
      .put('/v1/fragments/non-existent-id')
      .auth(userEmail, password)
      .set('content-type', 'text/plain')
      .send('I will never be saved!');

    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        status: 'error',
        error: expect.objectContaining({
          code: 404,
          message: 'Fragment not found',
        }),
      })
    );
  });
});
