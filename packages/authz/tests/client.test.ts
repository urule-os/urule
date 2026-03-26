import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthzClient } from '../src/client.js';
import type { AuthzConfig } from '../src/types.js';

/**
 * Create a mock OpenFgaClient with vi.fn() stubs for all methods we use.
 */
function createMockFgaClient() {
  return {
    check: vi.fn(),
    write: vi.fn(),
    listObjects: vi.fn(),
    writeAuthorizationModel: vi.fn(),
  };
}

const TEST_CONFIG: AuthzConfig = {
  apiUrl: 'http://localhost:8080',
  storeId: 'test-store-id',
  modelId: 'test-model-id',
};

describe('createAuthzClient', () => {
  let mockFga: ReturnType<typeof createMockFgaClient>;

  beforeEach(() => {
    mockFga = createMockFgaClient();
  });

  it('should create a client with the expected interface', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = createAuthzClient(TEST_CONFIG, mockFga as any);

    expect(client).toBeDefined();
    expect(typeof client.check).toBe('function');
    expect(typeof client.writeTuples).toBe('function');
    expect(typeof client.deleteTuples).toBe('function');
    expect(typeof client.listObjects).toBe('function');
    expect(typeof client.listRelations).toBe('function');
    expect(typeof client.ensureModel).toBe('function');
  });

  describe('check', () => {
    it('should return allowed: true when OpenFGA allows', async () => {
      mockFga.check.mockResolvedValue({ allowed: true, resolution: 'direct' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = createAuthzClient(TEST_CONFIG, mockFga as any);

      const result = await client.check('user:alice', 'member', 'org:acme');

      expect(result).toEqual({ allowed: true, resolution: 'direct' });
      expect(mockFga.check).toHaveBeenCalledWith({
        user: 'user:alice',
        relation: 'member',
        object: 'org:acme',
      });
    });

    it('should return allowed: false when OpenFGA denies', async () => {
      mockFga.check.mockResolvedValue({ allowed: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = createAuthzClient(TEST_CONFIG, mockFga as any);

      const result = await client.check('user:bob', 'owner', 'org:acme');

      expect(result).toEqual({ allowed: false, resolution: undefined });
    });
  });

  describe('writeTuples', () => {
    it('should call the SDK write with correct tuple keys', async () => {
      mockFga.write.mockResolvedValue({});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = createAuthzClient(TEST_CONFIG, mockFga as any);

      await client.writeTuples([
        { user: 'user:alice', relation: 'member', object: 'org:acme' },
        { user: 'user:bob', relation: 'admin', object: 'org:acme' },
      ]);

      expect(mockFga.write).toHaveBeenCalledWith({
        writes: [
          { user: 'user:alice', relation: 'member', object: 'org:acme' },
          { user: 'user:bob', relation: 'admin', object: 'org:acme' },
        ],
      });
    });

    it('should pass conditions when present', async () => {
      mockFga.write.mockResolvedValue({});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = createAuthzClient(TEST_CONFIG, mockFga as any);

      await client.writeTuples([
        {
          user: 'user:alice',
          relation: 'viewer',
          object: 'workspace:ws1',
          condition: { name: 'time_based', context: { start: '2024-01-01' } },
        },
      ]);

      expect(mockFga.write).toHaveBeenCalledWith({
        writes: [
          {
            user: 'user:alice',
            relation: 'viewer',
            object: 'workspace:ws1',
            condition: { name: 'time_based', context: { start: '2024-01-01' } },
          },
        ],
      });
    });
  });

  describe('deleteTuples', () => {
    it('should call the SDK write with deletes', async () => {
      mockFga.write.mockResolvedValue({});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = createAuthzClient(TEST_CONFIG, mockFga as any);

      await client.deleteTuples([
        { user: 'user:alice', relation: 'member', object: 'org:acme' },
      ]);

      expect(mockFga.write).toHaveBeenCalledWith({
        deletes: [
          { user: 'user:alice', relation: 'member', object: 'org:acme' },
        ],
      });
    });
  });

  describe('listObjects', () => {
    it('should return the list of objects from the SDK', async () => {
      mockFga.listObjects.mockResolvedValue({
        objects: ['workspace:ws1', 'workspace:ws2'],
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = createAuthzClient(TEST_CONFIG, mockFga as any);

      const result = await client.listObjects('user:alice', 'member', 'workspace');

      expect(result).toEqual(['workspace:ws1', 'workspace:ws2']);
      expect(mockFga.listObjects).toHaveBeenCalledWith({
        user: 'user:alice',
        relation: 'member',
        type: 'workspace',
      });
    });

    it('should return empty array when no objects found', async () => {
      mockFga.listObjects.mockResolvedValue({ objects: [] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = createAuthzClient(TEST_CONFIG, mockFga as any);

      const result = await client.listObjects('user:nobody', 'owner', 'org');

      expect(result).toEqual([]);
    });
  });

  describe('listRelations', () => {
    it('should check all known relations for the object type', async () => {
      // org has: owner, admin, member
      mockFga.check
        .mockResolvedValueOnce({ allowed: false }) // owner
        .mockResolvedValueOnce({ allowed: true })  // admin
        .mockResolvedValueOnce({ allowed: true });  // member

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = createAuthzClient(TEST_CONFIG, mockFga as any);

      const result = await client.listRelations('user:alice', 'org:acme');

      expect(result).toEqual(['admin', 'member']);
      expect(mockFga.check).toHaveBeenCalledTimes(3);
    });
  });

  describe('ensureModel', () => {
    it('should write the authorization model and return the model ID', async () => {
      mockFga.writeAuthorizationModel.mockResolvedValue({
        authorization_model_id: 'model-123',
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = createAuthzClient(TEST_CONFIG, mockFga as any);

      const modelId = await client.ensureModel();

      expect(modelId).toBe('model-123');
      expect(mockFga.writeAuthorizationModel).toHaveBeenCalledTimes(1);
    });
  });
});
