// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
// Importing the Express framework to create the router and define routes.
const express = require('express');

// Create a router on which to mount our API endpoints
const router = express.Router();

// Importing the `rawBody` middleware and post/get/delete Fragments functions
const { postFragment, rawBody } = require('./post');
const { getFragments, getFragmentById, getFragmentDataById } = require('./get');
const { deleteFragment } = require('./delete');

// Post
router.post('/fragments', rawBody(), postFragment);

// Get
router.get('/fragments/:id/info', getFragmentDataById);
router.get('/fragments/:id', getFragmentById);
router.get('/fragments', getFragments);

// Delete
router.delete('/fragments/:id', deleteFragment);

module.exports = router;
