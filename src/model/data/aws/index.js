// scr/model/data/aws/index.js

// Import required AWS clients and commands
const s3Client = require('./s3Client');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const ddbDocClient = require('./ddbDocClient');
const { PutCommand, GetCommand, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const logger = require('../../../logger');

// Validate environment variables during startup
if (!process.env.AWS_DYNAMODB_TABLE_NAME) {
  throw new Error('AWS_DYNAMODB_TABLE_NAME is not set. Please check your environment variables.');
}
if (!process.env.AWS_S3_BUCKET_NAME) {
  throw new Error('AWS_S3_BUCKET_NAME is not set. Please check your environment variables.');
}

// Writes a fragment's metadata to DynamoDB
function writeFragment(fragment) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Item: fragment,
  };

  const command = new PutCommand(params);

  try {
    return ddbDocClient.send(command);
  } catch (err) {
    logger.warn({ err, params, fragment }, 'Error writing fragment to DynamoDB');
    throw err;
  }
}

// Reads a fragment's metadata from DynamoDB
async function readFragment(ownerId, id) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  };

  const command = new GetCommand(params);

  try {
    const data = await ddbDocClient.send(command);
    return data?.Item;
  } catch (err) {
    logger.warn({ err, params }, 'Error reading fragment from DynamoDB');
    throw err;
  }
}

// Writes a fragment's data to S3
async function writeFragmentData(ownerId, id, data) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
    Body: data,
  };

  const command = new PutObjectCommand(params);

  try {
    await s3Client.send(command);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error uploading fragment data to S3');
    throw new Error('Unable to upload fragment data');
  }
}

// Converts a stream to a buffer
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

// Reads a fragment's data from S3
async function readFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  const command = new GetObjectCommand(params);

  try {
    const data = await s3Client.send(command);
    return streamToBuffer(data.Body);
  } catch (err) {
    const { Bucket, Key } = params;
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('Unable to read fragment data');
  }
}

// Lists fragments for a given user, either ids-only or full objects
async function listFragments(ownerId, expand = false) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    KeyConditionExpression: 'ownerId = :ownerId',
    ExpressionAttributeValues: {
      ':ownerId': ownerId,
    },
  };

  if (!expand) {
    params.ProjectionExpression = 'id';
  }

  const command = new QueryCommand(params);

  try {
    const data = await ddbDocClient.send(command);
    return !expand ? data?.Items.map((item) => item.id) : data?.Items;
  } catch (err) {
    logger.error({ err, params }, 'Error getting all fragments for user from DynamoDB');
    throw err;
  }
}

// Deletes a fragment's metadata from DynamoDB and its data from S3
async function deleteFragment(ownerId, id) {
  const s3Key = `${ownerId}/${id}`;
  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: s3Key,
  };
  const dynamoParams = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  };
  const deleteDynamoCommand = new DeleteCommand(dynamoParams);

  try {
    logger.info(`Deleting fragment ${id} owned by ${ownerId}`);

    // Delete metadata from DynamoDB
    try {
      await ddbDocClient.send(deleteDynamoCommand);
      logger.info(`Metadata for fragment ${id} deleted from DynamoDB`);
    } catch (err) {
      logger.warn(
        `Metadata for fragment ${id} not found or already deleted from DynamoDB: ${err.message}`
      );
    }

    // Delete raw data from S3
    if (process.env.AWS_S3_BUCKET_NAME) {
      try {
        logger.info(`Deleting raw data from S3 with key: ${s3Key}`);
        await s3Client.send(new DeleteObjectCommand(s3Params));
        logger.info(`S3 object ${s3Key} deleted successfully`);
      } catch (err) {
        logger.warn(`S3 object ${s3Key} not found or already deleted: ${err.message}`);
      }
    }

    logger.info(`Fragment ${id} successfully deleted for user ${ownerId}`);
    return { success: true, message: 'Fragment deleted successfully' };
  } catch (err) {
    logger.error(
      {
        error: err.message,
        ownerId,
        fragmentId: id,
        s3Key,
      },
      `Error deleting fragment ${id} for user ${ownerId}`
    );
    throw new Error('Unable to delete fragment');
  }
}

module.exports = {
  listFragments,
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
};
