import { describe, it, expect } from 'vitest';
import { validateBaseEntity, isValidULID, isValidISODateTime } from '../../src/validators/entity-validator.js';

describe('validateBaseEntity', () => {
  it('validates a correct base entity', () => {
    const result = validateBaseEntity({
      id: '01HZQX5K8B3YNPWJ4G0RCMVT6E',
      createdAt: '2024-06-01T12:00:00.000Z',
      updatedAt: '2024-06-01T12:00:00.000Z',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects null', () => {
    const result = validateBaseEntity(null);
    expect(result.valid).toBe(false);
  });

  it('rejects invalid ULID', () => {
    const result = validateBaseEntity({
      id: 'not-a-ulid',
      createdAt: '2024-06-01T12:00:00.000Z',
      updatedAt: '2024-06-01T12:00:00.000Z',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('ULID'))).toBe(true);
  });

  it('rejects invalid datetime', () => {
    const result = validateBaseEntity({
      id: '01HZQX5K8B3YNPWJ4G0RCMVT6E',
      createdAt: 'not-a-date',
      updatedAt: '2024-06-01T12:00:00.000Z',
    });
    expect(result.valid).toBe(false);
  });
});

describe('isValidULID', () => {
  it('accepts valid ULIDs', () => {
    expect(isValidULID('01HZQX5K8B3YNPWJ4G0RCMVT6E')).toBe(true);
  });

  it('rejects invalid ULIDs', () => {
    expect(isValidULID('too-short')).toBe(false);
    expect(isValidULID('')).toBe(false);
    expect(isValidULID('01hzqx5k8b3ynpwj4g0rcmvt6e')).toBe(false); // lowercase
  });
});

describe('isValidISODateTime', () => {
  it('accepts valid ISO datetimes', () => {
    expect(isValidISODateTime('2024-06-01T12:00:00.000Z')).toBe(true);
    expect(isValidISODateTime('2024-06-01T12:00:00Z')).toBe(true);
    expect(isValidISODateTime('2024-06-01T12:00:00+05:30')).toBe(true);
  });

  it('rejects invalid datetimes', () => {
    expect(isValidISODateTime('2024-06-01')).toBe(false);
    expect(isValidISODateTime('not-a-date')).toBe(false);
  });
});
