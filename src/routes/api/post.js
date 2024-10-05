// src/routes/api/post.js

const express = require('express');
const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const logger = require('../../logger');

// Support sending various Content-Types on the body up to 5M in size
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      // See if we can parse this content type. If we can, `req.body` will be
      // a Buffer (e.g., `Buffer.isBuffer(req.body) === true`). If not, `req.body`
      // will be equal to an empty Object `{}` and `Buffer.isBuffer(req.body) === false`
      const { type } = contentType.parse(req);
      return Fragment.isSupportedType(type);
    },
  });
const postFragment = async (req, res) => {
  try {
    // Log the request start
    logger.info('Received POST /fragments request');
    logger.info(`Headers: ${JSON.stringify(req.headers)}`);
    logger.info(`Body: ${req.body}`);

    // Parse Content-Type header
    const type = contentType.parse(req.headers['content-type']).type;

    // Log the parsed content type
    logger.info(`Parsed Content-Type: ${type}`);

    // Validate content type
    if (!Fragment.isSupportedType(type)) {
      logger.error(`Unsupported content type: ${type}`);
      return res.status(400).json({ error: 'Unsupported media type' });
    }

    const ownerId = req.user;

    // Validate ownerId
    if (!ownerId) {
      logger.error('Missing ownerId in request');
      return res.status(400).json({ error: 'ownerId is required' });
    }

    // Log the received ownerId
    logger.info(`Received ownerId: ${ownerId}`);

    // Check if body is missing or empty
    if (!req.body || req.body.length === 0) {
      const contentLength = req.headers['content-length'] || 0;
      logger.error(`Missing or empty body in request. Content-Length: ${contentLength}`);
      return res.status(400).json({ error: 'Body is required' });
    }

    // Create a new Fragment
    const fragment = new Fragment({
      ownerId,
      type,
      size: req.body.length,
    });

    // Save fragment metadata
    await fragment.save();
    logger.debug(`Saving fragment metadata with ID: ${fragment.id}`);

    // Save fragment data
    await fragment.setData(req.body);

    // Log success
    logger.info(`Fragment created successfully with ID: ${fragment.id}`);

    // Configuring fragment microservice's URL
    const location = `${process.env.API_URL || `http://${req.headers.host}`}/fragments/${fragment.id}`;

    // Respond with the created fragment
    res.status(201).location(location).json({ fragment });
  } catch (err) {
    // Log any errors encountered
    logger.error(`Error creating fragment: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export both rawBody and postFragment
module.exports = postFragment;
module.exports.rawBody = rawBody;
