const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');

const editFragment = async (req, res) => {
  const id = req.params.id;
  const ownerId = req.user;
  const type = req.get('Content-Type');
  const body = req.body;

  logger.info(`User: ${ownerId}, Fragment ID: ${id}, Type: ${type}`);

  try {
    const fragment = await Fragment.byId(ownerId, id);

    if (fragment.type === type) {
      logger.debug({ fragment }, 'Fragment found and type matches');
      await fragment.setData(body);
      await fragment.save();

      logger.debug('Fragment updated successfully');
      return res.status(200).json(createSuccessResponse({ fragment }));
    } else {
      logger.warn('Fragment type mismatch');
      return res
        .status(400)
        .json(createErrorResponse(400, 'Fragment type cannot be changed due to type mismatch'));
    }
  } catch (err) {
    logger.error(`Unexpected error in editFragment: ${err.message}`);

    if (err.message.includes('not found')) {
      logger.error(`Fragment not found`);
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    logger.error(`Failed to update fragment`);
    return res.status(500).json(createErrorResponse(500, 'Failed to update fragment'));
  }
};

module.exports = { editFragment };
