// tests/unit/get.test.js

const request = require('supertest');

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
  test('authenticated users get a fragments array', async () => {
    console.log('Using .htpasswd file from:', process.env.HTPASSWD_FILE);

    const res = await request(app).get('/v1/fragments').auth(userEmail, password);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  // Test resources that can't be found, expecting to get a 404
  test('Unrecognized URL path, page cannot be found', () => {
    return (
      request(app)
        .get('/v1/i-love-sushi') // Path that doesn't exist

        // Must authenticate the user, because without authentication,
        // we won't reach the stage of checking a url (passing V1)
        .auth(userEmail, password) // Authenticate with valid credentials

        .expect(404)
    ); // Expecting a 404 Not Found response
  });
});
