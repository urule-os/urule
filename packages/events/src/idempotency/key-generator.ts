import { ulid } from 'ulid';

/**
 * Generate a unique idempotency key for deduplication.
 */
export function generateIdempotencyKey(): string {
  return ulid();
}

/**
 * Generate a deterministic idempotency key from components.
 * Useful when you want the same event to produce the same key.
 */
export function deterministicKey(...parts: string[]): string {
  return parts.join(':');
}
