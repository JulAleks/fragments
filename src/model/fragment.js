//src/model/fragment.js
// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');
const logger = require('../logger');

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    // Validating that all parameters were passed
    if (!ownerId) {
      logger.error('Fragment creation failed: ownerId is required');
      throw new Error('ownerId is required');
    }
    if (!type) {
      logger.error('type is required');
      throw new Error('type is required');
    }
    if (typeof size !== 'number' || size < 0) {
      logger.error('size must be a non-negative number');
      throw new Error('size must be a non-negative number');
    }
    if (!Fragment.isSupportedType(type)) {
      logger.error(`Unsupported type: ${type}`);
      throw new Error(`Unsupported type: ${type}`);
    }

    this.id = id || randomUUID(); // Generate a new UUID if id is not provided
    this.ownerId = ownerId; // Assign the passed id
    this.created = created || new Date().toISOString(); // Default to current date if not provided
    this.updated = updated || this.created; // Default to created date if updated is not provided
    this.type = type; //Assign type
    this.size = size; //Assign size

    logger.info(`Fragment created with ID: ${this.id}, type: ${this.type}, size: ${this.size}`); // Not logging the user ID for security
    logger.debug(`Fragment details: ${JSON.stringify(this)}`);
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    return await listFragments(ownerId, expand);
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    logger.info(`Gets a fragment ${id} for a user`); // Not logging the user ID for security
    const fragment = await readFragment(ownerId, id);
    if (!fragment) {
      logger.error(`Fragment with id ${id} not found`);
      throw new Error(`Fragment with id ${id} not found`);
    }
    return fragment;
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static async delete(ownerId, id) {
    logger.info(`Deleting fragment ID: ${id}`);
    try {
      await deleteFragment(ownerId, id);
      logger.info(`Fragment with ID: ${id} deleted successfully`);
    } catch (error) {
      logger.error(`Failed to delete fragment ID: ${id}, Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Saves the current fragment to the database
   * @returns Promise<void>
   */
  async save() {
    this.updated = new Date().toISOString(); // Update the timestamp
    logger.info(`Saving fragment with ID: ${this.id}`);
    try {
      await writeFragment(this);
      logger.info(`Fragment saved successfully with ID: ${this.id}`);
    } catch (error) {
      logger.error(`Failed to save fragment with ID: ${this.id}, Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  async getData() {
    logger.info(`Retrieving data for fragment ID: ${this.id}`);
    try {
      const data = await readFragmentData(this.ownerId, this.id);
      logger.debug(`Data retrieved for fragment ID: ${this.id}, size: ${data.length}`);
      return data;
    } catch (error) {
      logger.error(`Failed to retrieve data for fragment ID: ${this.id}, Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      //If the data is not Buffer
      logger.warn(
        `Invalid data type for fragment ID: ${this.id}. Expected Buffer but got ${typeof data}`
      );
      throw new Error('Data must be a Buffer');
    }
    this.size = data.length; // Update the size with the length of the buffer
    this.updated = new Date().toISOString(); // Update the timestamp
    await this.save();
    logger.info(`Setting data for fragment ID: ${this.id}, new size: ${this.size}`);
    try {
      await writeFragmentData(this.ownerId, this.id, data);
      logger.info(`Data successfully set for fragment ID: ${this.id}`);
    } catch (error) {
      logger.error(`Failed to set data for fragment ID: ${this.id}, Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    // Supported content type to be added more next labs/assignments
    const supportedFormats = {
      'text/plain': ['text/plain'],
      'application/json': ['application/json'],
      'text/markdown': ['text/markdown'],
      'text/html': ['text/html'],
      'text/csv': ['text/csv'],
      /*
   Currently, supports the above. Others will be added later.
  'image/png': ['image/png'],
  'image/jpeg': ['image/jpeg'],
  'image/webp': ['image/webp'],
  'image/gif': ['image/gif']
  */
    };
    // Return types or empty array
    return supportedFormats[this.mimeType] || [];
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'var contentType = require('content-type')')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    // Supported content type to be added more next labs/assignments
    const supportedTypes = {
      'text/plain': ['text/plain'],
      'application/json': ['application/json'],
      'text/markdown': ['text/markdown'],
      'text/html': ['text/html'],
      'text/csv': ['text/csv'],
      /*
   Currently, supports the above. Others will be added later.
  'image/png': ['image/png'],
  'image/jpeg': ['image/jpeg'],
  'image/webp': ['image/webp'],
  'image/gif': ['image/gif']
  */
    };

    // Extract the MIME type from the value
    const { type } = contentType.parse(value);

    // Check if the extracted MIME type exists in the supportedTypes object
    return Object.keys(supportedTypes).includes(type);
  }
}

module.exports.Fragment = Fragment;
