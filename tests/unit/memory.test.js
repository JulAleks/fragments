const memoryIndex = require('../../src/model/data/memory/index');

// Defining all the test fragments
const fragment1 = {
  ownerId: 'julia',
  id: '001',
  content: 'Cattle dogs for life!',
};

const fragment2 = {
  ownerId: 'julia',
  id: '002',
  content: 'Bark, play, cuddle!',
};

const fragment3 = {
  ownerId: 'julia',
  id: '003',
  content: 'Zoomies, treats, naps!',
};

const fragment4 = {
  ownerId: 'julia',
  id: '004',
  content: 'Furry energy rockets!',
};

describe('GET /fragments', () => {
  // Before each test save the fragments to the in memory db
  beforeEach(async () => {
    await memoryIndex.writeFragment(fragment1);
    await memoryIndex.writeFragment(fragment2);
    await memoryIndex.writeFragment(fragment3);
  });

  // Reading existing fragment
  test('Read a fragment', async () => {
    // Read the fragment from the memory db
    const result = await memoryIndex.readFragment(fragment1.ownerId, fragment1.id);

    // Expecting:
    expect(result).toBeDefined();
    expect(result.id).toBe(fragment1.id);
    expect(result.ownerId).toBe(fragment1.ownerId);
    expect(result.content).toBe(fragment1.content);
  });

  // Reading non-existing fragment
  test('Read a non existing fragment', async () => {
    // Read the fragment from the memory db
    const result = await memoryIndex.readFragment('wrong_user', 'wrong_id');

    // Expecting:
    expect(result).toBeUndefined();
  });

  // Wrting data
  describe('Write fragment data', () => {
    test('Write a fragment', async () => {
      await memoryIndex.writeFragment(fragment4);

      const result = await memoryIndex.readFragment('julia', '004');
      expect(result).toBeDefined();
      expect(result.content).toBe(fragment4.content);
    });

    test('Write a fragment data buffer to memory', async () => {
      // Creatign a new buffer
      const buffer = Buffer.from('Donut worry, be happy!');
      // Write buffer to memory db
      await memoryIndex.writeFragmentData(fragment1.ownerId, fragment1.id, buffer);

      // Read the fragment data to verify
      const result = await memoryIndex.readFragmentData(fragment1.ownerId, fragment1.id);

      // Expecting:
      expect(result).toBeDefined();
      expect(result).toEqual(buffer); // Expecting it to match the buffer
    });

    // Write a fragment data buffer to memory with missing user
    test('Write a fragment data buffer to memory with missing user', async () => {
      // Creating a new buffer
      const buffer = Buffer.from('I will never be saved!');
      const badUser = null;
      const badID = '123';

      // Expecting an error when writing a fragment with a missing userID
      await expect(memoryIndex.writeFragmentData(badUser, badID, buffer)).rejects.toThrow(
        `primaryKey and secondaryKey strings are required, got primaryKey=${badUser}, secondaryKey=${badID}`
      );
    });

    // Write a fragment with null fragment id
    test('Write a fragment with null fragment id', async () => {
      // Creating a new buffer
      const buffer = Buffer.from('I will never be saved!');
      const badID = null;

      // Expecting an error when writing a fragment with a missing userID
      await expect(memoryIndex.writeFragmentData(fragment1.ownerId, badID, buffer)).rejects.toThrow(
        `primaryKey and secondaryKey strings are required, got primaryKey=${fragment1.ownerId}, secondaryKey=${badID}`
      );
    });
  });

  // List all fragments
  describe('Get all fragments for Julia', () => {
    // Getting all fragments for "julia" without expand
    test('Get all fragments for user without expand', async () => {
      const result = await memoryIndex.listFragments('julia', false);

      // Expecting:
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(['001', '002', '003', '004']); // Expecting only IDs
    });

    // Getting all fragments for "julia" with expand
    test('Get all fragments for user with expand', async () => {
      const result = await memoryIndex.listFragments('julia', true);
      // Expecting:
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([fragment1, fragment2, fragment3, fragment4]); // Expecting full objects
    });

    // Getting all fragments for missing user
    test('Get all fragments for user with expand', async () => {
      await expect(memoryIndex.listFragments(null, true)).rejects.toThrow(
        `primaryKey string is required, got primaryKey=${null}`
      );
    });
  });

  describe('Delete fragment', () => {
    test('Delete fragment', async () => {
      // Delete the fragment
      await memoryIndex.deleteFragment(fragment1.ownerId, fragment1.id);

      // Trying to read to see it was deleted
      const deletedFragment = await memoryIndex.readFragmentData(fragment1.ownerId, fragment1.id);

      // Expecting:
      expect(deletedFragment).toBeUndefined(); // deletedFragment should be undefined
    });
  });
});
