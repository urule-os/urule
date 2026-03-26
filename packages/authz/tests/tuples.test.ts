import { describe, it, expect } from 'vitest';
import {
  orgTuple,
  workspaceTuple,
  agentTuple,
  roomTuple,
  packageTuple,
  mcpServerTuple,
  parentTuple,
} from '../src/tuples.js';
import { RELATIONS } from '../src/relations.js';

describe('tuple helpers', () => {
  describe('orgTuple', () => {
    it('should create a tuple with user: and org: prefixes', () => {
      const tuple = orgTuple('alice', RELATIONS.MEMBER, 'acme');

      expect(tuple).toEqual({
        user: 'user:alice',
        relation: 'member',
        object: 'org:acme',
      });
    });

    it('should work with owner relation', () => {
      const tuple = orgTuple('bob', RELATIONS.OWNER, 'nimiq');

      expect(tuple).toEqual({
        user: 'user:bob',
        relation: 'owner',
        object: 'org:nimiq',
      });
    });
  });

  describe('workspaceTuple', () => {
    it('should create a tuple with workspace: prefix', () => {
      const tuple = workspaceTuple('alice', RELATIONS.VIEWER, 'ws-001');

      expect(tuple).toEqual({
        user: 'user:alice',
        relation: 'viewer',
        object: 'workspace:ws-001',
      });
    });
  });

  describe('agentTuple', () => {
    it('should create a tuple with agent: prefix', () => {
      const tuple = agentTuple('alice', RELATIONS.CAN_INVOKE, 'agent-x');

      expect(tuple).toEqual({
        user: 'user:alice',
        relation: 'can_invoke',
        object: 'agent:agent-x',
      });
    });
  });

  describe('roomTuple', () => {
    it('should create a tuple with room: prefix', () => {
      const tuple = roomTuple('alice', RELATIONS.MEMBER, 'room-42');

      expect(tuple).toEqual({
        user: 'user:alice',
        relation: 'member',
        object: 'room:room-42',
      });
    });
  });

  describe('packageTuple', () => {
    it('should create a tuple with package: prefix', () => {
      const tuple = packageTuple('alice', RELATIONS.CAN_INSTALL, 'pkg-abc');

      expect(tuple).toEqual({
        user: 'user:alice',
        relation: 'can_install',
        object: 'package:pkg-abc',
      });
    });
  });

  describe('mcpServerTuple', () => {
    it('should create a tuple with mcp_server: prefix', () => {
      const tuple = mcpServerTuple('alice', RELATIONS.CAN_INVOKE, 'mcp-1');

      expect(tuple).toEqual({
        user: 'user:alice',
        relation: 'can_invoke',
        object: 'mcp_server:mcp-1',
      });
    });
  });

  describe('parentTuple', () => {
    it('should create a parent relation from workspace to org', () => {
      const tuple = parentTuple('workspace', 'ws-001', 'org', 'acme');

      expect(tuple).toEqual({
        user: 'org:acme',
        relation: 'parent',
        object: 'workspace:ws-001',
      });
    });

    it('should create a parent relation from agent to workspace', () => {
      const tuple = parentTuple('agent', 'agent-x', 'workspace', 'ws-001');

      expect(tuple).toEqual({
        user: 'workspace:ws-001',
        relation: 'parent',
        object: 'agent:agent-x',
      });
    });

    it('should create a parent relation from room to workspace', () => {
      const tuple = parentTuple('room', 'room-42', 'workspace', 'ws-001');

      expect(tuple).toEqual({
        user: 'workspace:ws-001',
        relation: 'parent',
        object: 'room:room-42',
      });
    });

    it('should create a parent relation from mcp_server to workspace', () => {
      const tuple = parentTuple('mcp_server', 'mcp-1', 'workspace', 'ws-001');

      expect(tuple).toEqual({
        user: 'workspace:ws-001',
        relation: 'parent',
        object: 'mcp_server:mcp-1',
      });
    });
  });
});
