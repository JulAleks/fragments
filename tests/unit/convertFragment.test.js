//tests/unit/convertFragment.test.js
const { convertFragment } = require('../../src/utils/conversion');
const yaml = require('js-yaml');

describe('convertFragment', () => {
  // Test Data
  const markdownData = '# Cloud Computing for Programmers\nThis is **Markdown**!';
  const plainTextData = 'This is plain text.\nNew line here.';
  const csvData = 'Name,Breed,Age\nBubbles,Cattle Dog,9';
  const jsonData = JSON.stringify({ Name: 'Bubbles', Breed: 'Cattle Dog', Age: 9 });
  const yamlData = yaml.dump(JSON.parse(jsonData));

  // Test for converting Markdown to HTML
  test('converts markdown to HTML', () => {
    const result = convertFragment(markdownData, 'text/markdown', 'html');
    expect(result.convertedData).toContain('<h1>Cloud Computing for Programmers</h1>');
    expect(result.newMimeType).toBe('text/html');
  });

  // Test for converting plain text to HTML
  test('converts plain text to HTML', () => {
    const result = convertFragment(plainTextData, 'text/plain', 'html');
    expect(result.convertedData).toContain('<p>This is plain text.</p>');
    expect(result.newMimeType).toBe('text/html');
  });

  // Test for converting CSV to HTML
  test('converts CSV to HTML', () => {
    const result = convertFragment(csvData, 'text/csv', 'html');
    expect(result.convertedData).toContain('<table>');
    expect(result.newMimeType).toBe('text/html');
  });

  // Test for converting JSON to YAML
  test('converts JSON to YAML', () => {
    const result = convertFragment(jsonData, 'application/json', 'yaml');
    expect(result.convertedData.trim()).toBe(yamlData.trim());
    expect(result.newMimeType).toBe('application/yaml');
  });

  // Test for converting JSON to plain text
  test('converts JSON to plain text', () => {
    const result = convertFragment(jsonData, 'application/json', 'txt');
    expect(result.convertedData).toBe(JSON.stringify(JSON.parse(jsonData), null, 2));
    expect(result.newMimeType).toBe('text/plain');
  });

  // Test for converting YAML to JSON
  test('converts YAML to JSON', () => {
    const result = convertFragment(yamlData, 'application/yaml', 'json');
    expect(result.convertedData).toEqual(JSON.parse(jsonData));
    expect(result.newMimeType).toBe('application/json');
  });

  // Test for returning original YAML
  test('returns original YAML data', () => {
    const result = convertFragment(yamlData, 'application/yaml', 'yaml');
    expect(result.convertedData).toEqual(yamlData);
    expect(result.newMimeType).toBe('application/yaml');
  });
});
