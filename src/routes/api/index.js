// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
// Importing the Express framework to create the router and define routes.
const express = require('express');

// Importing the `rawBody` middleware from `post.js`, which is used to parse raw binary data (e.g., Buffers).
const rawBody = require('./post').rawBody;

// Create a router on which to mount our API endpoints
const router = express.Router();

// Define our first route, which will be: GET /v1/fragments
router.get('/fragments', require('./get'));

// Post a fragment route. This route uses the `rawBody()` middleware to handle raw binary data in the request.
// Use a raw body parser for POST, which will give a `Buffer` Object or `{}` at `req.body`
router.post('/fragments', rawBody(), require('./post'));

module.exports = router;
