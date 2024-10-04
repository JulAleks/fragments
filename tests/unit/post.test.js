const request = require('supertest');
const app = require('../../src/app');

// Testing credentials
const userEmail = 'user1@email.com';
const password = 'password1';

// Fragment metadata
const fragment = {
  ownerId: '11d4c22e42c8f61feaba154683dea407b101cfd90987dda9e342843263ca420a',
  type: 'text/plain',
};

// Test data
const testData = 'Doggies for life!';

// Reusable function for making a POST request
const authPostTest = (email, passwd, type = null, ownId, data = null) => {
  const req = request(app).post('/v1/fragments').auth(email, passwd); // Basic Auth credentials

  if (type) {
    //If there is Type assign it
    req.set('Content-Type', type);
  }

  if (data) {
    req.send(data); // Send data if available
  }

  return req;
};

// Post test PKG
describe('POST /v1/fragments', () => {
  // Endpoint should exist and return a response
  test('Endpoint should exist and return a response', async () => {
    const response = await authPostTest(userEmail, password, fragment.type, fragment.ownerId);

    // Expect sucess >200 and not server error >=500
    expect(response.statusCode).toBeGreaterThanOrEqual(200);
    expect(response.statusCode).toBeLessThan(500);
  });

  // Should create a fragment and return the created fragment data
  test('Should create a fragment and return the created fragment data', async () => {
    const response = await authPostTest(
      userEmail,
      password,
      fragment.type,
      fragment.ownerId,
      testData
    );

    // Check that the status code is 201 Created
    expect(response.statusCode).toBe(201);

    // Check that the response contains the fragment object
    expect(response.body).toHaveProperty('fragment');

    // Check that specific fields match, ignoring any additional fields
    expect(response.body.fragment).toEqual(
      expect.objectContaining({
        ownerId: fragment.ownerId, // Ensure the ownerId matches the one provided
        type: fragment.type, // Ensure the type matches
        size: testData.length, // Ensure the size is the length of the test data
      })
    );
  });

  // Should return 400 for unsupported content type 'app/bad-type'
  test('Should return 400 for unsupported content type', async () => {
    const response = await authPostTest(
      userEmail,
      password,
      'app/bad-type', // Bad type
      fragment.ownerId,
      testData
    );

    // Expect 400 Bad Request for unsupported media type
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error', 'Unsupported media type');
  });

  // Should return 400 if Content-Type header (Content-Type) is missing
  test('Should return 400 if Content-Type header is missing', async () => {
    const response = await authPostTest(userEmail, password, null, fragment.ownerId, testData); // Missing type

    // Expect 400 Bad Request for missing Content-Type
    expect(response.statusCode).toBe(400);
  });

  // Should return 400 if body is missing
  test('Should return 400 if body is missing', async () => {
    const response = await authPostTest(userEmail, password, fragment.type, fragment.ownerId); // No body sent
    // Expect 400 Bad Request for missing body
    expect(response.statusCode).toBe(400);
  });

  // Should return 413 if body exceeds size limit
  test('Should return 413 if body exceeds size limit', async () => {
    const largeData = 'a'.repeat(6 * 1024 * 1024); // Create a 6MB string

    const response = await authPostTest(
      userEmail,
      password,
      fragment.type,
      fragment.ownerId,
      largeData // Over max data
    );
    // Expect 413 Payload Too Large
    expect(response.statusCode).toBe(413);
  });

  // Should return 401 for unauthorized access
  test('Should return 401 for unauthorized access', async () => {
    const response = await authPostTest(
      'badUser', // Bad credentials
      'badPassword',
      fragment.type,
      fragment.ownerId,
      testData
    );

    // Expect 401 Unauthorized
    expect(response.statusCode).toBe(401);
  });

  // Should create a fragment and return all expected fragment properties
  test('Should create a fragment and return all expected fragment properties', async () => {
    const response = await authPostTest(
      userEmail,
      password,
      fragment.type,
      fragment.ownerId,
      testData
    );

    // Check that the status code is 201 Created
    expect(response.statusCode).toBe(201);

    // Check that the response contains the fragment object with necessary properties
    expect(response.body).toHaveProperty('fragment');
    expect(response.body.fragment).toEqual(
      expect.objectContaining({
        ownerId: fragment.ownerId,
        type: fragment.type,
        size: testData.length,
        id: expect.any(String), // Check if id is present
        created: expect.any(String), // Check if created timestamp is present
      })
    );

    // Check if the Location header is present
    expect(response.headers).toHaveProperty('location');
  });
});
