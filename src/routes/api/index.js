// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
// Importing the Express framework to create the router and define routes.
const express = require('express');

// Importing the `rawBody` middleware from `post.js`, which is used to parse raw binary data (e.g., Buffers).
const rawBody = require('./post').rawBody;
const postFragment = require('./post');
const { getFragments, getFragmentById, getFragmentMetadataById } = require('./get');

// Create a router on which to mount our API endpoints
const router = express.Router();

// Routes - GET
router.get('/fragments/:id/info', getFragmentMetadataById);
router.get('/fragments/:id', getFragmentById);
router.get('/fragments', getFragments);

// Routes - POST
router.post('/fragments', rawBody(), postFragment);

module.exports = router;
