// src/routes/api/getFragments.js

const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
/**
 * Get a list of fragments for the current user
 */
module.exports.getFragments = async (req, res) => {
  try {
    const ownerId = req.user;
    const fragments = await Fragment.byUser(ownerId);
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
 * Get a specific fragment by ID for the current user
 */
module.exports.getFragmentById = async (req, res) => {
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

/**
 * Get data and content for a specific fragment by ID for the current user
 */
module.exports.getFragmentDataById = async (req, res) => {
  try {
    const ownerId = req.user;
    const { id } = req.params;

    const fragment = await Fragment.byId(ownerId, id);

    logger.info(`Fetching fragment and data for ID: ${id}`);

    if (!fragment) {
      logger.warn('Fragment not found');
      return res.status(404).json({ error: 'Fragment not found' });
    }

    // Check if the fragment data is present and log it
    if (!fragment.data) {
      logger.warn('Fragment data is missing!');
    } else {
      logger.info(`Fragment data: ${fragment.data}`);
    }

    // Include both metadata and the actual fragment data
    const fetchedFragment = {
      id: fragment.id,
      ownerId: fragment.ownerId,
      type: fragment.type,
      createdDate: fragment.createdDate,
      size: fragment.size,
      data: fragment.data,
    };

    res.status(200).json({ status: 'ok', fragment: fetchedFragment });
  } catch (error) {
    logger.error(`Failed to fetch fragment and metadata: ${error}`);
    res.status(500).json({ error: error.message });
  }
};
