// tests/unit/getFragment.test.js
const yaml = require('js-yaml');
const request = require('supertest');
const app = require('../../src/app');

// Test credentials
const userEmail = 'user1@email.com';
const password = 'password1';

// Helper function to create a fragment
const createFragment = async (type, data) => {
  return await request(app)
    .post('/v1/fragments')
    .auth(userEmail, password)
    .set('Content-Type', type)
    .send(data);
};

/******* TESTING FOR GET FRAGMENT INFORMATION *******/

describe('GET /v1/fragments/:id/info', () => {
  let fragmentIdPlain;
  let fragmentIdMarkdown;
  let fragmentIdHTML;
  let fragmentIdCSV;
  let fragmentIdJSON;
  let fragmentIdYAML;

  // Create fragments before each test
  beforeEach(async () => {
    const resPostPlain = await createFragment('text/plain', 'Sample plain text fragment data');
    expect(resPostPlain.statusCode).toBe(201);
    fragmentIdPlain = resPostPlain.body.fragment.id;

    const resPostMarkdown = await createFragment(
      'text/markdown',
      '# Markdown Fragment\nContent here'
    );
    expect(resPostMarkdown.statusCode).toBe(201);
    fragmentIdMarkdown = resPostMarkdown.body.fragment.id;

    const resPostHTML = await createFragment('text/html', '<h1>Bubbles</h1><p>Cattle Dog</p>');
    expect(resPostHTML.statusCode).toBe(201);
    fragmentIdHTML = resPostHTML.body.fragment.id;

    const resPostCSV = await createFragment('text/csv', 'Name,Breed,Age\nBubbles,Cattle Dog,9');
    expect(resPostCSV.statusCode).toBe(201);
    fragmentIdCSV = resPostCSV.body.fragment.id;

    const resPostJSON = await createFragment(
      'application/json',
      JSON.stringify({ Name: 'Bubbles', Breed: 'Cattle Dog', Age: 9 })
    );
    expect(resPostJSON.statusCode).toBe(201);
    fragmentIdJSON = resPostJSON.body.fragment.id;

    const resPostYAML = await createFragment(
      'application/yaml',
      'Name: Bubbles\nBreed: Cattle Dog\nAge: 9'
    );
    expect(resPostYAML.statusCode).toBe(201);
    fragmentIdYAML = resPostYAML.body.fragment.id;
  });

  /* TEST FOR TEXT/PLAIN */
  test('authenticated users get fragment metadata for text/plain by ID', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentIdPlain}/info`)
      .auth(userEmail, password);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body.fragment).toHaveProperty('id', fragmentIdPlain);
    expect(res.body.fragment).toHaveProperty('type', 'text/plain');
  });

  /* TEST FOR TEXT/MARKDOWN */
  test('authenticated users get fragment metadata for text/markdown by ID', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentIdMarkdown}/info`)
      .auth(userEmail, password);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body.fragment).toHaveProperty('id', fragmentIdMarkdown);
    expect(res.body.fragment).toHaveProperty('type', 'text/markdown');
  });

  /* TEST FOR TEXT/HTML */
  test('authenticated users get fragment metadata for text/html by ID', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentIdHTML}/info`)
      .auth(userEmail, password);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body.fragment).toHaveProperty('id', fragmentIdHTML);
    expect(res.body.fragment).toHaveProperty('type', 'text/html');
  });

  /* TEST FOR TEXT/CSV */
  test('authenticated users get fragment metadata for text/csv by ID', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentIdCSV}/info`)
      .auth(userEmail, password);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body.fragment).toHaveProperty('id', fragmentIdCSV);
    expect(res.body.fragment).toHaveProperty('type', 'text/csv');
  });

  /* TEST FOR APPLICATION/JSON */
  test('authenticated users get fragment metadata for application/json by ID', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentIdJSON}/info`)
      .auth(userEmail, password);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body.fragment).toHaveProperty('id', fragmentIdJSON);
    expect(res.body.fragment).toHaveProperty('type', 'application/json');
  });

  /* TEST FOR APPLICATION/YAML */
  test('authenticated users get fragment metadata for application/yaml by ID', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentIdYAML}/info`)
      .auth(userEmail, password);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body.fragment).toHaveProperty('id', fragmentIdYAML);
    expect(res.body.fragment).toHaveProperty('type', 'application/yaml');
  });

  /* TEST FOR NON-EXISTENT FRAGMENT */
  test('authenticated users get 404 for non-existent fragment', async () => {
    const res = await request(app).get('/v1/fragments/invalidId/info').auth(userEmail, password);
    expect(res.statusCode).toBe(404);
  });

  /* TEST FOR UNAUTHENTICATED USER */
  test('unauthenticated users get 401 when trying to access fragment metadata', async () => {
    const res = await request(app).get(`/v1/fragments/${fragmentIdPlain}/info`);
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});

/******* TESTING FOR GET FRAGMENT CONTENT *******/
describe('GET /v1/fragments/:id', () => {
  /* TEST FOR TEXT */
  describe('FOR TEXT: GET /v1/fragments/:id', () => {
    const textData = 'Doggies for life!';
    let fragmentId;

    //create a fragment before each test
    beforeEach(async () => {
      const resPost = await createFragment('text/plain', textData);
      expect(resPost.statusCode).toBe(201);
      fragmentId = resPost.body.fragment.id;
    });

    //get text back
    test('authenticated users get a specific text fragment by ID', async () => {
      const res = await request(app).get(`/v1/fragments/${fragmentId}`).auth(userEmail, password);
      expect(res.statusCode).toBe(200);
      expect(res.text).toBe(textData);
    });

    //text/plain acan convert to .txt
    test('convert text to .txt', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragmentId}.txt`)
        .auth(userEmail, password);
      expect(res.statusCode).toBe(200);
      expect(res.text).toBe(textData);
    });
  });

  /* TEST FOR MARKDOWN */
  describe('FOR MARKDOWN: GET /v1/fragments/:id', () => {
    const fragmentMD = {
      ownerId: userEmail,
      type: 'text/markdown',
    };

    const markdownData = `
# Hello World
This is **Markdown**!
`;
    let fID;

    //Create a fragment before each test
    beforeEach(async () => {
      const resPost = await request(app)
        .post('/v1/fragments')
        .auth(userEmail, password)
        .set('Content-Type', fragmentMD.type)
        .send(markdownData);

      expect(resPost.statusCode).toBe(201);
      expect(resPost.body).toHaveProperty('fragment');

      fID = resPost.body.fragment.id;
      expect(fID).toBeDefined();
    });

    //get markdown as original
    test('authenticated users get a markdown fragment by ID', async () => {
      const res = await request(app).get(`/v1/fragments/${fID}`).auth(userEmail, password);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/markdown');
      expect(res.text.trim()).toBe(markdownData.trim());
    });
    //text/markdown can convert to .md, .html, .txt
    //get markdown as .md
    test('convert to .md', async () => {
      const res = await request(app).get(`/v1/fragments/${fID}.md`).auth(userEmail, password);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/markdown');
      expect(res.text.trim()).toBe(markdownData.trim());
    });

    //get markdown as .txt
    test('convert to .txt', async () => {
      const res = await request(app).get(`/v1/fragments/${fID}.txt`).auth(userEmail, password);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text.trim()).toBe(markdownData.trim());
    });
    //get markdown as HTML
    test('convert to HTML', async () => {
      const res = await request(app).get(`/v1/fragments/${fID}.html`).auth(userEmail, password);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      const expectedHTML = `
<h1>Hello World</h1>
<p>This is <strong>Markdown</strong>!</p>
`.trim();
      expect(res.text.trim()).toEqual(expectedHTML);
    });
  });

  /* TEST FOR HTML */
  describe('FOR HTML: GET /v1/fragments/:id', () => {
    const htmlData = '<h1>Doggies for life!</h1>';
    let fragmentId;

    beforeEach(async () => {
      const resPost = await createFragment('text/html', htmlData);
      expect(resPost.statusCode).toBe(201);
      fragmentId = resPost.body.fragment.id;
    });

    test('authenticated users get a HTML fragment by ID', async () => {
      const res = await request(app).get(`/v1/fragments/${fragmentId}`).auth(userEmail, password);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toBe(htmlData);
    });

    //text/html can convert to .html, .txt
    test('convert to .html', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragmentId}.html`)
        .auth(userEmail, password);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      const expectedHTML = `<h1>Doggies for life!</h1>`;
      expect(res.text.trim()).toBe(expectedHTML);
    });

    //convert to txt
    test('convert to .txt', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragmentId}.txt`)
        .auth(userEmail, password);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toBe(htmlData);
    });
  });

  /* TEST FOR CSV */
  describe('FOR CSV: GET /v1/fragments/:id', () => {
    const csvData = `Name,Breed,Age\nBubbles,Cattle Dog,9\n`;
    let fragmentId;

    beforeEach(async () => {
      const resPost = await createFragment('text/csv', csvData);
      expect(resPost.statusCode).toBe(201);
      fragmentId = resPost.body.fragment.id;
    });

    //get original
    test('authenticated users get a CSV fragment by ID', async () => {
      const res = await request(app).get(`/v1/fragments/${fragmentId}`).auth(userEmail, password);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text.trim()).toEqual(csvData.trim());
    });

    //text/csv can be converted to .csv, .txt, .json
    //convert to .csv
    test('convert to .csv', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragmentId}.csv`)
        .auth(userEmail, password);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text.trim()).toEqual(csvData.trim());
    });

    //convert to .txt
    test('convert to .txt', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragmentId}.txt`)
        .auth(userEmail, password);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text.trim()).toEqual(csvData.trim());
    });

    // Convert to .json
    test('convert to .json', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragmentId}.json`)
        .auth(userEmail, password);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeDefined();

      const expectedData = [
        {
          Name: 'Bubbles',
          Breed: 'Cattle Dog',
          Age: '9',
        },
      ];

      expect(res.body).toEqual(expectedData);
    });
  });

  /* TEST FOR JSON */
  describe('FOR JSON: GET /v1/fragments/:id', () => {
    const jsonData = `{"Name": "Bubbles", "Breed": "Cattle Dog", "Age": 9}`;
    let fragmentId;

    // Create a JSON fragment before each test
    beforeEach(async () => {
      const resPost = await createFragment('application/json', jsonData);
      expect(resPost.statusCode).toBe(201);
      fragmentId = resPost.body.fragment.id;
    });

    // Get original JSON fragment
    test('authenticated users retrieve the created JSON fragment by ID', async () => {
      const res = await request(app).get(`/v1/fragments/${fragmentId}`).auth(userEmail, password);
      expect(res.statusCode).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body.fragment.id).toEqual(fragmentId);
      expect(res.body.data).toEqual(JSON.parse(jsonData));
    });

    // Convert to .json
    test('convert to .json', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragmentId}.json`)
        .auth(userEmail, password);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeDefined();

      const expectedData = {
        Name: 'Bubbles',
        Breed: 'Cattle Dog',
        Age: 9,
      };

      expect(res.body).toEqual(expectedData);
    });

    // Convert to .yaml
    test('convert to .yaml', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragmentId}.yaml`)
        .auth(userEmail, password);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/yaml');

      const expectedYAML = yaml.dump(JSON.parse(jsonData)).trim();
      expect(res.text.trim()).toEqual(expectedYAML);
    });

    // Convert to .yml
    test('convert to .yml', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragmentId}.yml`)
        .auth(userEmail, password);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/yaml');

      const expectedYAML = yaml.dump(JSON.parse(jsonData)).trim();
      expect(res.text.trim()).toEqual(expectedYAML);
    });

    // Convert to .txt
    test('convert to .txt', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragmentId}.txt`)
        .auth(userEmail, password);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');

      const expectedText = JSON.stringify(JSON.parse(jsonData), null, 2).trim();
      expect(res.text.trim()).toEqual(expectedText);
    });
  });

  /* TEST FOR YAML */
  describe('FOR YAML: GET /v1/fragments/:id', () => {
    const yamlData = `Name: Bubbles\nBreed: Cattle Dog\nAge: 9\n`;
    let fragmentId;

    beforeEach(async () => {
      const resPost = await createFragment('application/yaml', yamlData);
      expect(resPost.statusCode).toBe(201);
      fragmentId = resPost.body.fragment.id;
    });

    //get orignal
    test('authenticated users get a YAML fragment by ID', async () => {
      const res = await request(app).get(`/v1/fragments/${fragmentId}`).auth(userEmail, password);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/yaml');
      expect(res.text.trim()).toEqual(yamlData.trim());
    });

    //convert .yaml
    test('convert .yaml', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragmentId}.yaml`)
        .auth(userEmail, password);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/yaml');
      expect(res.text.trim()).toEqual(yamlData.trim());
    });

    //convert .txt
    test('convert .txt', async () => {
      const res = await request(app)
        .get(`/v1/fragments/${fragmentId}.txt`)
        .auth(userEmail, password);
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text.trim()).toEqual(yamlData.trim());
    });
  });
});

/**** TEST TO GET ALL FRAGMENTS ******/
describe('GET /v1/fragments', () => {
  test('authenticated users get a list of fragments', async () => {
    const res = await request(app).get('/v1/fragments').auth(userEmail, password);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });
});
