// tests/unit/post.test.js

const request = require('supertest');
const app = require('../../src/app');
const hashEmail = require('../../src/hash');
const fs = require('fs');
const path = require('path');

// Testing credentials
const userEmail = 'user1@email.com';
const password = 'password1';

// Fragment metadata
const fragment = {
  ownerId: hashEmail(userEmail),
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

  // Should create a JSON and return the created fragment data
  test('Should create a JSON fragment and return the created fragment data', async () => {
    // Fragment metadata
    const fragmentJSON = {
      ownerId: hashEmail(userEmail),
      type: 'application/json',
    };

    const JSONData = `{
  "Name": "Bubbles",
  "Breed": "Cattle Dog",
  "Age": 9
}`;
    const jsonDataString = JSON.stringify(JSONData);
    const response = await authPostTest(
      userEmail,
      password,
      fragmentJSON.type,
      fragmentJSON.ownerId,
      jsonDataString
    );

    // Check that the status code is 201 Created
    expect(response.statusCode).toBe(201);

    // Check that the response contains the fragment object
    expect(response.body).toHaveProperty('fragment');

    // Check that specific fields match, ignoring any additional fields
    expect(response.body.fragment).toEqual(
      expect.objectContaining({
        ownerId: fragmentJSON.ownerId, // Ensure the ownerId matches the one provided
        type: fragmentJSON.type, // Ensure the type matches
        size: jsonDataString.length, // Ensure the size is the length of the test data
      })
    );
  });

  test('Should create an HTML fragment and return the created fragment data', async () => {
    // Fragment metadata
    const fragmentHTML = {
      ownerId: hashEmail(userEmail),
      type: 'text/html',
    };

    const htmlData = '<div><h1>Bubbles for Life!</h1></div>';

    const response = await authPostTest(
      userEmail,
      password,
      'text/html',
      fragmentHTML.ownerId,
      htmlData
    );

    // Check that the status code is 201 Created
    expect(response.statusCode).toBe(201);

    // Check that the response contains the fragment object
    expect(response.body).toHaveProperty('fragment');

    // Check that specific fields match, ignoring any additional fields
    expect(response.body.fragment).toEqual(
      expect.objectContaining({
        ownerId: fragmentHTML.ownerId, // Ensure the ownerId matches the one provided
        type: 'text/html', // Ensure the type is HTML
        size: htmlData.length, // Ensure the size is the length of the HTML data
      })
    );
  });

  test('Should create an Markdown fragment and return the created fragment data', async () => {
    // Fragment metadata
    const fragmentMD = {
      ownerId: hashEmail(userEmail),
      type: 'text/markdown',
    };

    const markdownData = `
    # Portuguese Cattle Dogs are vigorous animals of pleasant overall appearance, sometimes with a rather striking color. Their gait is free, easy and energetic.
      Loyal and docile with people they know, Portuguese Cattle Dogs do a great job protecting livestock from attacks by the many wolves that still prowl the mountains of northern Portugal.

    ## Breed Specifics
    - **Country**: Portugal  
    - **Size category**: Large  
    - **Avg life expectancy**: 11-13 years

    ## Traits
    Confident / Calm / Gentle / Resilient / Intelligent / Loyal
    `;

    const response = await authPostTest(
      userEmail,
      password,
      'text/markdown', // Specify the content type as markdown
      fragmentMD.ownerId,
      markdownData
    );

    // Check that the status code is 201 Created
    expect(response.statusCode).toBe(201);

    // Check that the response contains the fragment object
    expect(response.body).toHaveProperty('fragment');

    // Check that specific fields match, ignoring any additional fields
    expect(response.body.fragment).toEqual(
      expect.objectContaining({
        ownerId: fragmentMD.ownerId, // Ensure the ownerId matches the one provided
        type: 'text/markdown', // Ensure the type is markdown
        size: markdownData.length, // Ensure the size is the length of the HTML data
      })
    );
  });

  ///////////////////////////////////////////////////////////////////////

  // Should return 415 for unsupported content type 'app/bad-type'
  test('Should return 415 for unsupported content type', async () => {
    const response = await authPostTest(
      userEmail,
      password,
      'app/bad-type', // Bad type
      fragment.ownerId,
      testData
    );

    // Expect 400 Bad Request for unsupported media type
    expect(response.statusCode).toBe(415);
    expect(response.body).toHaveProperty('error', 'Unsupported media type');
  });

  // Should return 415 if Content-Type header (Content-Type) is missing
  test('Should return 415 if Content-Type header is missing', async () => {
    const response = await authPostTest(userEmail, password, null, fragment.ownerId, testData); // Missing type

    // Expect 400 Bad Request for missing Content-Type
    expect(response.statusCode).toBe(415);
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

// Post IMG test
describe('POST /v1/fragments with image content types', () => {
  // Helper function to load mock binary image data
  const loadMockImageData = (fileName) =>
    fs.readFileSync(path.join(__dirname, '../mock-images', fileName));

  /*//Should create a fragment with PNG image and return fragment data
  test('Should create a fragment with PNG image and return fragment data', async () => {
    const pngData = loadMockImageData('pushen.png');

    const response = await authPostTest(
      userEmail,
      password,
      'image/png',
      fragment.ownerId,
      pngData
    );

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('fragment');
    expect(response.body.fragment).toEqual(
      expect.objectContaining({
        ownerId: fragment.ownerId,
        type: 'image/png',
        size: pngData.length,
      })
    );
  });*/

  //Should create a fragment with JPEG image and return fragment data
  test('Should create a fragment with JPEG image and return fragment data', async () => {
    const jpegData = loadMockImageData('Bubbles-JPG.jpg');

    const response = await authPostTest(
      userEmail,
      password,
      'image/jpeg',
      fragment.ownerId,
      jpegData
    );

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('fragment');
    expect(response.body.fragment).toEqual(
      expect.objectContaining({
        ownerId: fragment.ownerId,
        type: 'image/jpeg',
        size: jpegData.length,
      })
    );
  });

  //Should create a fragment with WEBP image and return fragment data
  test('Should create a fragment with WEBP image and return fragment data', async () => {
    const webpData = loadMockImageData('Bubbles-WEBP.webp');

    const response = await authPostTest(
      userEmail,
      password,
      'image/webp',
      fragment.ownerId,
      webpData
    );

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('fragment');
    expect(response.body.fragment).toEqual(
      expect.objectContaining({
        ownerId: fragment.ownerId,
        type: 'image/webp',
        size: webpData.length,
      })
    );
  });

  //Should create a fragment with GIF image and return fragment data
  test('Should create a fragment with GIF image and return fragment data', async () => {
    const gifData = loadMockImageData('Bubbles-GIF.gif');

    const response = await authPostTest(
      userEmail,
      password,
      'image/gif',
      fragment.ownerId,
      gifData
    );

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('fragment');
    expect(response.body.fragment).toEqual(
      expect.objectContaining({
        ownerId: fragment.ownerId,
        type: 'image/gif',
        size: gifData.length,
      })
    );
  });
});
