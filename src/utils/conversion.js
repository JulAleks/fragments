const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();
const yaml = require('js-yaml');
const logger = require('../logger');
const sharp = require('sharp');

const convertFragment = async (data, mimeType, extension, res) => {
  let convertedData;
  let newMimeType;

  try {
    switch (extension) {
      case 'html':
        if (mimeType === 'text/markdown') {
          convertedData = md.render(data.toString());
          newMimeType = 'text/html';
        } else if (mimeType === 'text/html') {
          convertedData = data.toString();
          newMimeType = 'text/html';
        } else {
          return unsupportedConversion(res);
        }
        break;

      case 'csv':
        if (mimeType === 'text/csv') {
          convertedData = data.toString();
          newMimeType = 'text/csv';
        } else {
          return unsupportedConversion(res);
        }
        break;

      case 'md':
        if (mimeType === 'text/markdown') {
          convertedData = data.toString();
          newMimeType = 'text/markdown';
        } else {
          return unsupportedConversion(res);
        }
        break;

      case 'plain':
      case 'txt':
        if (
          mimeType.startsWith('text/') ||
          mimeType === 'application/json' ||
          mimeType === 'application/yaml'
        ) {
          if (mimeType === 'application/json') {
            const jsonData = JSON.parse(data.toString());
            convertedData = JSON.stringify(jsonData, null, 2);
          } else {
            convertedData = data.toString();
          }
          newMimeType = 'text/plain';
        } else {
          return unsupportedConversion(res);
        }
        break;

      case 'json':
        if (mimeType === 'application/json') {
          convertedData = JSON.parse(data.toString());
          newMimeType = 'application/json';
        } else if (mimeType === 'text/csv') {
          convertedData = parseCSVToJSON(data.toString());
          newMimeType = 'application/json';
        } else {
          return unsupportedConversion(res);
        }
        break;

      case 'yaml':
      case 'yml':
        if (mimeType === 'application/json') {
          const jsonData = JSON.parse(data.toString());
          convertedData = yaml.dump(jsonData);
          newMimeType = 'application/yaml';
        } else if (mimeType === 'application/yaml') {
          convertedData = data.toString();
          newMimeType = 'application/yaml';
        } else {
          return unsupportedConversion(res);
        }
        break;

      case 'png':
      case 'jpeg':
      case 'webp':
      case 'avif':
      case 'gif':
        if (!mimeType.startsWith('image/')) {
          return unsupportedConversion(res);
        }
        try {
          if (mimeType !== `image/${extension}`) {
            convertedData = await sharp(data)[extension]().toBuffer();
          } else {
            convertedData = data; // Return as-is if already in the desired format
          }
          newMimeType = `image/${extension}`;
        } catch (err) {
          logger.error(`Error converting to ${extension}:`, err.message);
          return unsupportedConversion(res);
        }
        break;

      default:
        return unsupportedConversion(res);
    }

    return { convertedData, newMimeType };
  } catch (err) {
    logger.error('Error during conversion:', err.message);
    return unsupportedConversion(res);
  }
};

const unsupportedConversion = (res) => {
  res.status(415).json({ error: 'Unsupported Media Type' });
};

const parseCSVToJSON = (csvData) => {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    return headers.reduce((acc, header, index) => {
      acc[header.trim()] = values[index]?.trim();
      return acc;
    }, {});
  });
};

module.exports = { convertFragment };
