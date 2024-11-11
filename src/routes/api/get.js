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
    let { id } = req.params;
    let ext;
    const isInfoRequest = req.path.endsWith('/info');

    // Handle the case where no fragment ID is provided
    if (!id) {
      const expand = req.query.expand === '1';
      const fragments = await Fragment.byUser(req.user, expand);
      return res.status(200).json(createSuccessResponse({ fragments }));
    }

    // Get the fragment by ID
    const fragment = await Fragment.byId(req.user, id);
    if (!fragment) {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // Handle info request
    if (isInfoRequest) {
      return res.status(200).json(createSuccessResponse({ metadata: fragment }));
    }

    // Handle file extension conversion
    if (ext) {
      // Call convertFragment to handle the conversion logic
      const { convertedData, newMimeType } = convertFragment(fragment.data, fragment.mimeType, ext);

      // Return the converted data
      res.setHeader('Content-Type', newMimeType);
      return res.status(200).send(convertedData);
    }

    // Return the fragment's original data
    res.type(fragment.type);
    return res.send(fragment.data);
  } catch (error) {
    logger.error('Error in GET route:', error);
    return res.status(500).json(createErrorResponse(500, error.message));
  }
};

/**
 * Get a specific fragment by ID for the current user, check if conversion needed if so, use the helper fucntion to convert
 */

module.exports.getFragmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userID = req.user;

    // Split the raw id into actual id and extension
    const [newID, ext] = id.split('.');

    const userFrag = await Fragment.byUser(userID); // Get all the user's fragments
    if (!userFrag.includes(newID)) {
      return createErrorResponse(res.status(404).json({ error: `No Fragment with id: ${newID}` }));
    }

    const fragment = await Fragment.byId(userID, newID);
    const fData = await fragment.getData(); // Fetch the fragment's raw data

    // Handle conversion if extension is provided
    if (ext) {
      const { convertedData, newMimeType } = convertFragment(fData, fragment.mimeType, ext);
      res.setHeader('Content-Type', newMimeType);
      return res.status(200).send(convertedData);
    }

    // Return the fragment's data if no conversion is needed
    res.setHeader('Content-Type', fragment.mimeType);
    return res.status(200).send(fData);
  } catch (error) {
    logger.error('Server error', error.message);
    res.status(500).json(createErrorResponse(500, error.message));
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
