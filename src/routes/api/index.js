// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
// Importing the Express framework to create the router and define routes.
const express = require('express');
// Create a router on which to mount our API endpoints
const router = express.Router();
// Importing the `rawBody` middleware and `postFragment` function
const { postFragment, rawBody } = require('./post');
const { getFragments, getFragmentById, getFragmentDataById } = require('./get');

// Routes - POST
router.post('/fragments', rawBody(), postFragment);

// Routes - GET

// GET /fragments/:id/info returns an existing fragment's metadata
router.get('/fragments/:id/info', getFragmentDataById);

// GET /fragments/:id returns an existing fragment's data with the expected Content-Type.
// GET /fragments/:id.ext returns an existing fragment's data converted to a supported type
router.get('/fragments/:id', getFragmentById);

// GET /fragments returns fragment list for an authenticated user
// GET /fragments?expand=1 returns expanded fragment metadata for an authenticated user
router.get('/fragments', getFragments);

module.exports = router;
