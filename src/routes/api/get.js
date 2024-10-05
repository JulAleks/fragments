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

    logger.info(`Fetching fragment ID: ${id} for owner ID: ${ownerId}`);

    if (!fragment) {
      return res.status(404).json({ error: 'Fragment not found' });
    }

    console.log('Fragment found:', fragment);
    res.status(200).json(createSuccessResponse({ fragment }));
  } catch (error) {
    logger.error(`Failed to fetch fragment: ${error}`);
    res.status(404).json(createErrorResponse(404, error.message));
  }
};
