/**
 * The main entry-point for the v1 version of the fragments API.
 */
// Importing the Express framework to create the router and define routes.
const express = require('express');

// Importing the `rawBody` middleware from `post.js`, which is used to parse raw binary data (e.g., Buffers).
const rawBody = require('./post').rawBody;
const postFragment = require('./post');
const { getFragments, getFragmentById } = require('./get');

// Create a router on which to mount our API endpoints
const router = express.Router();

// Routes
router.get('/fragments/:id', getFragmentById);
router.get('/fragments', getFragments);

// Post a fragment route. This route uses the `rawBody()` middleware to handle raw binary data in the request.
// Use a raw body parser for POST, which will give a `Buffer` Object or `{}` at `req.body`
router.post('/fragments', rawBody(), postFragment);

module.exports = router;
