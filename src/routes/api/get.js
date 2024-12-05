const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const { convertFragment } = require('../../../src/utils/conversion');

/**
 * Get a list of fragments for the current user
 */
module.exports.getFragments = async (req, res) => {
  try {
    // Handle the case where no fragment ID is provided
    const expand = req.query.expand === '1';
    const fragments = await Fragment.byUser(req.user, expand);
    return res.status(200).json(createSuccessResponse({ fragments }));
  } catch (error) {
    logger.error(error, 'Error in GET route:');
    return res.status(500).json(createErrorResponse(500, error.message));
  }
};

/**
 * Get a specific fragment by ID for the current user
 */
module.exports.getFragmentById = async (req, res) => {
  const tempID = req.params.id; // Get the raw id passed
  const userID = req.user; // Get user

  // Split the raw id into actual id and extension if provided
  const [newID, ext] = tempID.split('.');

  try {
    // Get all the user's fragments to verify existence
    const userFragments = await Fragment.byUser(userID);

    if (!userFragments.includes(newID)) {
      logger.error(`No Fragment with ID: ${newID} found for the user.`);
      return res.status(404).json(createErrorResponse(404, `No Fragment with ID: ${newID} found`));
    }

    const fragment = await Fragment.byId(userID, newID);
    const fragmentData = await fragment.getData(); // Fetch the fragment's raw data

    // If no extension, return based on fragment type
    if (!ext) {
      const [type, subtype] = fragment.type.split('/');

      if (type === 'application') {
        switch (subtype) {
          case 'json':
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json(
              createSuccessResponse({
                fragment: { id: fragment.id, type: fragment.type },
                data: JSON.parse(fragmentData.toString()),
              })
            );
          case 'yaml':
            res.setHeader('Content-Type', 'application/yaml');
            return res.status(200).send(fragmentData.toString());
          default:
            logger.error(`Unsupported application subtype: ${subtype}`);
            return res
              .status(415)
              .json(createErrorResponse(415, `Unsupported application subtype: ${subtype}`));
        }
      }

      if (type === 'text') {
        res.setHeader('Content-Type', fragment.mimeType);
        return res.status(200).send(fragmentData.toString());
      }

      // Default case for raw data
      res.setHeader('Content-Type', fragment.mimeType);
      return res.status(200).send(fragmentData);
    }

    // If an extension is provided, check if conversion is supported
    if (!Fragment.isSupportedType(fragment.mimeType)) {
      logger.error(`Cannot convert from ${fragment.mimeType} to ${ext}`);
      return res
        .status(415)
        .json(createErrorResponse(415, `Cannot convert from ${fragment.mimeType} to ${ext}`));
    }

    // Perform conversion
    const { convertedData, newMimeType } = await convertFragment(
      fragmentData,
      fragment.mimeType,
      ext
    );
    res.setHeader('Content-Type', newMimeType);
    return res.status(200).send(convertedData);
  } catch (error) {
    logger.error('Server error:', error.message);
    return res.status(500).json(createErrorResponse(500, error.message));
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

    logger.info(`Fetching fragment ID: ${id}`); // Not logging user ID for security

    if (!fragment) {
      logger.warn('Fragment not found');
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    return res.status(200).json(createSuccessResponse({ fragment }));
  } catch (error) {
    logger.error(`Failed to fetch fragment: ${error}`);
    return res.status(500).json(createErrorResponse(500, error.message));
  }
};
