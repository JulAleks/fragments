// tests/unit/get.test.js

const request = require('supertest');
const { Fragment } = require('../../src/model/fragment');
const app = require('../../src/app');

//testing credentials
const userEmail = 'user1@email.com';
const password = 'password1';

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a standard fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth(userEmail, password);
    expect(res.statusCode).toBe(200); // Check for successful response
    expect(res.body.status).toBe('ok'); // Ensure the status is ok
    expect(Array.isArray(res.body.fragments)).toBe(true); // Check that fragments is an array
  });

  // Test for getting an expanded fragments array
  test('authenticated users get an expanded fragments array', async () => {
    const res = await request(app).get('/v1/fragments?expand=1').auth(userEmail, password);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    //checking that we are getting the full array
    if (res.body.fragments.length > 0) {
      const firstFragment = res.body.fragments[0];
      expect(firstFragment).toHaveProperty('id');
      expect(firstFragment).toHaveProperty('type');
    }
  });

  // Test resources that can't be found, expecting to get a 404
  test('Unrecognized URL path, page cannot be found', () => {
    return request(app)
      .get('/v1/i-love-sushi') // Path that doesn't exist
      .auth(userEmail, password) // Authenticate with valid credentials
      .expect(404); // Expecting a 404 Not Found response
  });

  test('server error during fragment retrieval logs error and returns 500', async () => {
    jest.spyOn(Fragment, 'byUser').mockRejectedValueOnce(new Error('Database connection failed'));

    const res = await request(app).get('/v1/fragments').auth(userEmail, password);
    expect(res.statusCode).toBe(500); // Expect Internal Server Error
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Database connection failed'); // Ensure the error message matches
  });

  test('unsupported application subtype returns 415 error', async () => {
    // Mock Fragment.byUser to include the fragment ID
    jest.spyOn(Fragment, 'byUser').mockResolvedValueOnce(['fragmentID']);

    // Mock Fragment.byId to return a fragment with an unsupported type
    jest.spyOn(Fragment, 'byId').mockResolvedValueOnce({
      id: 'fragmentID',
      type: 'application/unsupportedSubtype',
      getData: jest.fn().mockResolvedValueOnce(Buffer.from('unsupported data')),
    });

    const res = await request(app).get('/v1/fragments/fragmentID').auth(userEmail, password);

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toMatch(/Unsupported application subtype/);
  });
});
