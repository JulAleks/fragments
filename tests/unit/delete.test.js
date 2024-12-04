const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

// Testing credentials
const userEmail = 'user1@email.com';
const password = 'password1';

// Fragment metadata
const fragment = {
  type: 'text/plain',
};

// Test data
const testData = 'Doggies for life!';

// Reusable function for making a POST request
const authPostTest = (email, passwd, type = null, data = null) => {
  const req = request(app).post('/v1/fragments').auth(email, passwd); // Basic Auth credentials

  if (type) {
    req.set('Content-Type', type);
  }

  if (data) {
    req.send(data);
  }

  return req;
};

//reusable function for making a DELETE request
const authDeleteTest = (email, passwd, fragmentId) => {
  return request(app).delete(`/v1/fragments/${fragmentId}`).auth(email, passwd);
};

//Delete testing
describe('DELETE /v1/fragments/:id', () => {
  test('Should delete the fragment we made', async () => {
    const createResponse = await authPostTest(userEmail, password, fragment.type, testData);

    expect(createResponse.statusCode).toBe(201);
    const fragmentId = createResponse.body.fragment.id;

    const deleteResponse = await authDeleteTest(userEmail, password, fragmentId);

    expect(deleteResponse.statusCode).toBe(200);

    const getResponse = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth(userEmail, password);

    expect(getResponse.statusCode).toBe(404);
  });

  //Should return 404 if the fragment does not exist
  test('Should return 404 if the fragment does not exist', async () => {
    const nonExistentFragmentId = 'non-existent-id';

    const deleteResponse = await authDeleteTest(userEmail, password, nonExistentFragmentId);

    expect(deleteResponse.statusCode).toBe(404);
    expect(deleteResponse.body).toHaveProperty('error');
    expect(deleteResponse.body.error.message).toContain('does not exist');
  });

  //Mocking a server error to test for 500
  test('Should return 500 if deletion fails due to an error', async () => {
    const createResponse = await authPostTest(userEmail, password, fragment.type, testData);
    expect(createResponse.statusCode).toBe(201);

    const fragmentId = createResponse.body.fragment.id;

    jest.spyOn(Fragment, 'delete').mockImplementation(() => {
      throw new Error('Database error');
    });

    const deleteResponse = await authDeleteTest(userEmail, password, fragmentId);

    expect(deleteResponse.statusCode).toBe(500);
    expect(deleteResponse.body).toHaveProperty('error');
    expect(deleteResponse.body.error.message).toContain('Failed to delete fragment');

    //restore the original implementation of Fragment.delete
    Fragment.delete.mockRestore();
  });
});
