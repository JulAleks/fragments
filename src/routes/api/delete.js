// src/routes/api/delete.js

const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');

// Delete /fragments

module.exports.deleteFragment = async (req, res) => {
  const fragmentId = req.params.id;
  const ownerId = req.user;
  logger.info(`Request received to delete fragment: ${fragmentId} for user ${ownerId}`);

  try {
    const userFragments = await Fragment.byUser(ownerId);
    if (!userFragments.includes(fragmentId)) {
      const errorMessage = `Fragment ID ${fragmentId} does not exist for user ${ownerId}`;
      logger.warn(errorMessage);
      return res.status(404).json(createErrorResponse(404, errorMessage));
    }

    logger.info(`Fragment ${fragmentId} exists for user ${ownerId}. Proceeding with deletion.`);
    await Fragment.delete(ownerId, fragmentId);
    logger.info(`Fragment ${fragmentId} successfully deleted for user ${ownerId}`);
    return res.status(200).json(
      createSuccessResponse({
        status: 'ok',
        message: `Fragment ${fragmentId} was successfully deleted`,
      })
    );
  } catch (err) {
    const errorMessage = `Failed to delete fragment ${fragmentId} for user ${ownerId}: ${err.message}`;
    logger.error({ error: err }, errorMessage);
    return res.status(500).json(createErrorResponse(500, errorMessage));
  }
};
