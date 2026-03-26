import type { BaseEntity } from '../types/common.js';

export interface EntityValidationResult {
  valid: boolean;
  errors: string[];
}

const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Validates the base fields (id, createdAt, updatedAt) of any entity.
 */
export function validateBaseEntity(entity: unknown): EntityValidationResult {
  const errors: string[] = [];

  if (typeof entity !== 'object' || entity === null) {
    return { valid: false, errors: ['Entity must be a non-null object'] };
  }

  const obj = entity as Record<string, unknown>;

  if (typeof obj['id'] !== 'string' || !ULID_REGEX.test(obj['id'])) {
    errors.push('id must be a valid ULID (26 uppercase alphanumeric characters)');
  }

  if (typeof obj['createdAt'] !== 'string' || !ISO_DATETIME_REGEX.test(obj['createdAt'])) {
    errors.push('createdAt must be a valid ISO 8601 datetime string');
  }

  if (typeof obj['updatedAt'] !== 'string' || !ISO_DATETIME_REGEX.test(obj['updatedAt'])) {
    errors.push('updatedAt must be a valid ISO 8601 datetime string');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates that a string is a valid ULID.
 */
export function isValidULID(value: string): boolean {
  return ULID_REGEX.test(value);
}

/**
 * Validates that a string is a valid ISO 8601 datetime.
 */
export function isValidISODateTime(value: string): boolean {
  return ISO_DATETIME_REGEX.test(value);
}
