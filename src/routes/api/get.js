// src/routes/api/getFragments.js

const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { convertFragment } = require('../../../src/utils/conversion');
/**
 * Get a list of fragments for the current user
 */
module.exports.getFragments = async (req, res) => {
  try {
    const ownerId = req.user;
    const { expand } = req.query;

    let fragments;
    if (expand === '1') {
      fragments = await Fragment.byUser(ownerId, true);
    } else {
      fragments = await Fragment.byUser(ownerId);
    }
    logger.info('Request to get a list of fragments was submitted');

    res.status(200).json(
      createSuccessResponse({
        fragments: fragments.map((fragment) => fragment.id),
      })
    );
  } catch (error) {
    logger.error(`Failed to fetch fragments: ${error}`);
    res.status(500).json({ error: 'Failed to fetch fragments' });
  }
};

/**
 * Get a specific fragment by ID for the current user, check if conversion needed if so, use the helper fucntion to convert
 */

module.exports.getFragmentById = async (req, res) => {
  const tempID = req.params.id; // Get the raw id passed
  const userID = req.user; // Get user

  // Split the raw id into actual id and extension if provided
  const [newID, ext] = tempID.split('.');

  const userFrag = await Fragment.byUser(userID); // Get all the user's fragments

  if (!userFrag.includes(newID)) {
    logger.error(`No Fragment with id: ${newID} for a user`); // Not specifying the user id for security
    return createErrorResponse(
      res.status(404).json({ error: `No Fragment with id: ${newID} for user: ${userID} was found` })
    );
  }

  try {
    const fragment = await Fragment.byId(userID, newID);
    let fData = await fragment.getData(); // Fetch the fragment's raw data

    // Handle the response based on the existence of an extension
    if (!ext) {
      const [fType, fSubtype] = fragment.type.split('/');

      switch (fType) {
        case 'application':
          if (fSubtype === 'json') {
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json(
              createSuccessResponse({
                fragment: {
                  id: fragment.id,
                  type: fragment.type,
                },
                data: JSON.parse(fData.toString()),
              })
            );
          } else if (fSubtype === 'yaml') {
            res.setHeader('Content-Type', 'application/yaml');
            return res.status(200).send(fData.toString());
          } else {
            return createErrorResponse(
              res.status(415).json({ error: `Unsupported application subtype: ${fSubtype}` })
            );
          }

        case 'text':
          if (fSubtype === 'plain') {
            res.setHeader('Content-Type', 'text/plain');
            return res.status(200).send(fData.toString());
          }
          if (fSubtype === 'html') {
            res.setHeader('Content-Type', 'text/html');
            return res.status(200).send(fData.toString());
          } else if (fSubtype === 'markdown') {
            res.setHeader('Content-Type', 'text/markdown');
            return res.status(200).send(fData.toString());
          } else if (fSubtype === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            return res.status(200).send(fData.toString());
          } else {
            return createErrorResponse(
              res.status(415).json({ error: `Unsupported text subtype: ${fSubtype}` })
            );
          }

        default:
          res.setHeader('Content-Type', fragment.mimeType);
          return res.status(200).send(fData);
      }
    }

    // Handle conversion if an extension is provided
    if (!Fragment.isSupportedType(fragment.mimeType)) {
      return createErrorResponse(
        res.status(415).json({ error: `Cannot convert from ${fragment.mimeType} to ${ext}` })
      );
    }

    // Call helper to convert
    const { convertedData, newMimeType } = convertFragment(fData, fragment.mimeType, ext);
    res.setHeader('Content-Type', newMimeType);
    return res.status(200).send(convertedData);
  } catch (error) {
    return createErrorResponse(
      res.status(500).json({ error: 'Server error', message: error.message })
    );
  }
};

/**
 * Get data and content for a specific fragment by ID for the current user
 */

module.exports.getFragmentDataById = async (req, res) => {
  try {
    const ownerId = req.user;
    const { id } = req.params;
    const fragment = await Fragment.byId(ownerId, id);

    logger.info(`Fetching fragment ID: ${id}`); //not logging user id for security

    if (!fragment) {
      logger.warn('Fragment not found');
      return res.status(404).json({ error: 'Fragment not found' });
    }

    res.status(200).json(createSuccessResponse({ fragment }));
    res.status(200).send(fragment.data);
  } catch (error) {
    logger.error(`Failed to fetch fragment: ${error}`);
    res.status(404).json(createErrorResponse(404, error.message));
  }
};
