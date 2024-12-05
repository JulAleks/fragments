const { convertFragment } = require('../../src/utils/conversion');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

describe('convertFragment', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  const markdownData = '# Cloud Computing for Programmers\nThis is **Markdown**!';
  const plainTextData = 'This is plain text.\nNew line here.';
  const csvData = 'Name,Breed,Age\nBubbles,Cattle Dog,9';
  const jsonData = JSON.stringify({ Name: 'Bubbles', Breed: 'Cattle Dog', Age: 9 });
  const yamlData = yaml.dump(JSON.parse(jsonData));

  // ***Valid Conversions for text/plain***
  test('converts plain text to .txt', async () => {
    const result = await convertFragment(plainTextData, 'text/plain', 'txt', res);
    expect(result.convertedData).toBe(plainTextData);
    expect(result.newMimeType).toBe('text/plain');
  });

  // ***Valid Conversions for text/markdown***
  test('returns Markdown data for .md', async () => {
    const result = await convertFragment(markdownData, 'text/markdown', 'md', res);
    expect(result.convertedData).toBe(markdownData);
    expect(result.newMimeType).toBe('text/markdown');
  });

  test('converts Markdown to .html', async () => {
    const result = await convertFragment(markdownData, 'text/markdown', 'html', res);
    expect(result.convertedData).toContain('<h1>Cloud Computing for Programmers</h1>');
    expect(result.newMimeType).toBe('text/html');
  });

  test('converts Markdown to .txt', async () => {
    const result = await convertFragment(markdownData, 'text/markdown', 'txt', res);
    expect(result.convertedData).toBe(markdownData);
    expect(result.newMimeType).toBe('text/plain');
  });

  // ***Valid Conversions for text/html***
  test('returns HTML data for .html', async () => {
    const result = await convertFragment('<p>Test HTML</p>', 'text/html', 'html', res);
    expect(result.convertedData).toBe('<p>Test HTML</p>');
    expect(result.newMimeType).toBe('text/html');
  });

  test('converts HTML to .txt', async () => {
    const result = await convertFragment('<p>Test HTML</p>', 'text/html', 'txt', res);
    expect(result.convertedData).toBe('<p>Test HTML</p>');
    expect(result.newMimeType).toBe('text/plain');
  });

  // ***Valid Conversions for text/csv***
  test('returns CSV data for .csv', async () => {
    const result = await convertFragment(csvData, 'text/csv', 'csv', res);
    expect(result.convertedData).toBe(csvData);
    expect(result.newMimeType).toBe('text/csv');
  });

  test('converts CSV to .txt', async () => {
    const result = await convertFragment(csvData, 'text/csv', 'txt', res);
    expect(result.convertedData).toBe(csvData);
    expect(result.newMimeType).toBe('text/plain');
  });

  test('converts CSV to .json', async () => {
    const result = await convertFragment(csvData, 'text/csv', 'json', res);
    expect(result.convertedData).toEqual([{ Name: 'Bubbles', Breed: 'Cattle Dog', Age: '9' }]);
    expect(result.newMimeType).toBe('application/json');
  });

  // ***Valid Conversions for application/json***
  test('returns JSON data for .json', async () => {
    const result = await convertFragment(jsonData, 'application/json', 'json', res);
    expect(result.convertedData).toEqual(JSON.parse(jsonData));
    expect(result.newMimeType).toBe('application/json');
  });

  test('converts JSON to .yaml', async () => {
    const result = await convertFragment(jsonData, 'application/json', 'yaml', res);
    expect(result.convertedData.trim()).toBe(yamlData.trim());
    expect(result.newMimeType).toBe('application/yaml');
  });

  test('converts JSON to .yml', async () => {
    const result = await convertFragment(jsonData, 'application/json', 'yml', res);
    expect(result.convertedData.trim()).toBe(yamlData.trim());
    expect(result.newMimeType).toBe('application/yaml');
  });

  test('converts JSON to .txt', async () => {
    const result = await convertFragment(jsonData, 'application/json', 'txt', res);
    expect(result.convertedData).toBe(JSON.stringify(JSON.parse(jsonData), null, 2));
    expect(result.newMimeType).toBe('text/plain');
  });

  // ***Valid Conversions for application/yaml***
  test('returns YAML data for .yaml', async () => {
    const result = await convertFragment(yamlData, 'application/yaml', 'yaml', res);
    expect(result.convertedData).toEqual(yamlData);
    expect(result.newMimeType).toBe('application/yaml');
  });

  test('returns YAML data for .yml', async () => {
    const result = await convertFragment(yamlData, 'application/yaml', 'yml', res);
    expect(result.convertedData).toEqual(yamlData);
    expect(result.newMimeType).toBe('application/yaml');
  });

  test('converts YAML to .txt', async () => {
    const result = await convertFragment(yamlData, 'application/yaml', 'txt', res);
    expect(result.convertedData).toBe(yamlData);
    expect(result.newMimeType).toBe('text/plain');
  });

  // ***Invalid Cases***
  test('returns 415 for unsupported conversion', async () => {
    await convertFragment('test data', 'text/plain', 'unsupported', res);
    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unsupported Media Type' });
  });
});

describe('convertFragment - Image Tests', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // Load mock images
  const pngImage = fs.readFileSync(path.join(__dirname, '../mock-images/Bubbles-PNG.png'));
  const jpegImage = fs.readFileSync(path.join(__dirname, '../mock-images/Bubbles-JPG.jpg'));
  const webpImage = fs.readFileSync(path.join(__dirname, '../mock-images/Bubbles-WEBP.webp'));
  const gifImage = fs.readFileSync(path.join(__dirname, '../mock-images/Bubbles-GIF.gif'));

  // ***Tests for PNG***
  test('returns PNG as-is when MIME type is image/png', async () => {
    const result = await convertFragment(pngImage, 'image/png', 'png', res);
    expect(result.convertedData).toEqual(pngImage); // Should return the same buffer
    expect(result.newMimeType).toBe('image/png');
  });

  test('converts JPEG to PNG', async () => {
    const result = await convertFragment(jpegImage, 'image/jpeg', 'png', res);
    expect(result.newMimeType).toBe('image/png');
    // Additional validation for PNG format can be added if needed
  });

  // ***Tests for JPEG***
  test('returns JPEG as-is when MIME type is image/jpeg', async () => {
    const result = await convertFragment(jpegImage, 'image/jpeg', 'jpeg', res);
    expect(result.convertedData).toEqual(jpegImage); // Should return the same buffer
    expect(result.newMimeType).toBe('image/jpeg');
  });

  test('converts PNG to JPEG', async () => {
    const result = await convertFragment(pngImage, 'image/png', 'jpeg', res);
    expect(result.newMimeType).toBe('image/jpeg');
    // Additional validation for JPEG format can be added if needed
  });

  // ***Tests for WebP***
  test('returns WebP as-is when MIME type is image/webp', async () => {
    const result = await convertFragment(webpImage, 'image/webp', 'webp', res);
    expect(result.convertedData).toEqual(webpImage); // Should return the same buffer
    expect(result.newMimeType).toBe('image/webp');
  });

  test('converts PNG to WebP', async () => {
    const result = await convertFragment(pngImage, 'image/png', 'webp', res);
    expect(result.newMimeType).toBe('image/webp');
    // Additional validation for WebP format can be added if needed
  });

  // ***Tests for GIF***
  test('returns GIF as-is when MIME type is image/gif', async () => {
    const result = await convertFragment(gifImage, 'image/gif', 'gif', res);
    expect(result.convertedData).toEqual(gifImage); // Should return the same buffer
    expect(result.newMimeType).toBe('image/gif');
  });

  test('converts PNG to GIF', async () => {
    const result = await convertFragment(pngImage, 'image/png', 'gif', res);
    expect(result.newMimeType).toBe('image/gif');
    // Additional validation for GIF format can be added if needed
  });

  // ***Invalid Image Conversions***
  test('returns 415 for unsupported image conversion', async () => {
    const unsupportedImage = Buffer.from('fake-image-data');
    await convertFragment(unsupportedImage, 'image/unsupported', 'png', res);
    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unsupported Media Type' });
  });
});
