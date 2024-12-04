//tests/unit/convertion.test.js
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();
const yaml = require('js-yaml');
const logger = require('../logger');
/**
Converts fragment data based on the requested extension and MIME type.
**/
const convertFragment = (data, mimeType, extension, res) => {
  let convertedData;
  let newMimeType;

  try {
    switch (extension) {
      //if extantion that was passed html
      case 'html':
        if (mimeType === 'text/markdown') {
          const markdownContent = data.toString(); // Convert Buffer to string if needed
          convertedData = md.render(markdownContent); // Convert Markdown to HTML
          newMimeType = 'text/html'; // Set new type
        } else if (mimeType === 'text/plain') {
          convertedData = convertPlainTextToHTML(data.toString()); // Convert plain text to HTML
          newMimeType = 'text/html'; // Set correct MIME type for HTML output
        } else if (mimeType === 'text/csv') {
          const csvContent = data.toString();
          convertedData = convertCSVToHTML(csvContent); // Convert CSV to HTML
          newMimeType = 'text/html'; // Set correct MIME type for HTML output
        } else {
          convertedData = data.toString(); // Return original HTML content if MIME type is already text/html
          newMimeType = 'text/html';
        }
        break;
      //if extantion that was passed csv
      case 'csv':
        if (mimeType === 'text/csv') {
          // Return original CSV data
          convertedData = data.toString();
          newMimeType = 'text/csv';
        }
        break;
      //if extantion that was passed md
      case 'md':
        if (mimeType === 'text/markdown') {
          convertedData = data.toString(); // Return the original Markdown
          newMimeType = 'text/markdown'; // Set new type
        }
        break;
      //if extantion that was passed txt
      case 'txt':
        if (mimeType.startsWith('text/')) {
          // Return as plain text if already a text type
          convertedData = data.toString();
          newMimeType = 'text/plain';
        } else if (mimeType === 'application/json') {
          // Convert JSON to a pretty-printed plain text format
          const jsonData = JSON.parse(data.toString());
          convertedData = JSON.stringify(jsonData, null, 2);
          newMimeType = 'text/plain';
        } else if (mimeType === 'application/yaml') {
          // Return YAML content as plain text
          convertedData = data.toString();
          newMimeType = 'text/plain';
        }
        break;
      //if extantion that was passed json
      case 'json':
        if (mimeType === 'application/json') {
          convertedData = JSON.parse(data.toString()); // Convert JSON string to object
          newMimeType = 'application/json';
        } else if (mimeType === 'text/plain') {
          convertedData = JSON.parse(data.toString()); // Convert text to JSON
          newMimeType = 'application/json';
        } else if (mimeType === 'text/csv') {
          // Convert CSV to JSON
          const csvData = data.toString();
          convertedData = parseCSVToJSON(csvData); // Use a function to parse CSV to JSON
          newMimeType = 'application/json';
        }
        if (mimeType === 'application/yaml') {
          const jsonData = yaml.load(data.toString());
          convertedData = jsonData;
          newMimeType = 'application/json';
        }
        break;
      //if extantion that was passed yaml/yml
      case 'yaml':
      case 'yml':
        if (mimeType === 'application/json') {
          // Convert JSON to YAML
          const jsonData = JSON.parse(data.toString());
          convertedData = yaml.dump(jsonData);
          newMimeType = 'application/yaml';
        } else if (mimeType === 'application/yaml') {
          // Return original YAML data
          convertedData = data.toString();
          newMimeType = 'application/yaml';
        }
        break;
      //to add in future steps
      case 'png':
        //TO DO .png, .jpg, .webp, .gif, .avif
        break;
      case 'jpeg':
        //TO DO .png, .jpg, .webp, .gif, .avif
        break;
      case 'webp':
        //TO DO .png, .jpg, .webp, .gif, .avif
        break;
      case 'avif':
        //TO DO .png, .jpg, .webp, .gif, .avif
        break;
      case 'gif':
        //TO DO .png, .jpg, .webp, .gif, .avif
        break;
    }

    return { convertedData, newMimeType }; // Return converted data and MIME type
  } catch (err) {
    logger.error('Error during conversion:', err.message);
    //throw new Error('Conversion failed: ' + error.message);
    res.status(415).json({ error: 'Unsupported Media Type' });
  }
};

const convertPlainTextToHTML = (text) => {
  const lines = text.split('\n').filter((line) => line.trim() !== ''); // Split by line and filter empty lines
  return lines.map((line) => `<p>${line.trim()}</p>`).join(''); // Wrap each line in <p> tags
};

const convertCSVToHTML = (csvData) => {
  // Split CSV data into rows
  const rows = csvData.trim().split('\n');

  // Create HTML table rows
  const htmlRows = rows
    .map((row) => {
      const cells = row.split(','); // Split each row into cells
      const htmlCells = cells.map((cell) => `<td>${cell.trim()}</td>`).join(''); // Create table cells
      return `<tr>${htmlCells}</tr>`; // Create a table row
    })
    .join(''); // Join all rows

  // Wrap rows in a table
  return `<table>${htmlRows}</table>`;
};

// Helper function to parse CSV into JSON format
const parseCSVToJSON = (csvData) => {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(','); // Extract headers from the first row
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    return headers.reduce((acc, header, index) => {
      acc[header.trim()] = values[index].trim(); // Map each header to corresponding value
      return acc;
    }, {});
  });
};

module.exports = { convertFragment };
