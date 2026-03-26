import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Ajv = require('ajv').default as typeof import('ajv').default;
const manifestSchema = require('../schemas/package-manifest.schema.json') as Record<string, unknown>;

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(manifestSchema);

/**
 * Validates a package manifest against the JSON Schema.
 * Returns a result with `valid: true` if the manifest is valid,
 * or `valid: false` with a list of validation errors.
 */
export function validateManifest(manifest: unknown): ValidationResult {
  const valid = validate(manifest);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors: ValidationError[] = (validate.errors ?? []).map((err: { instancePath?: string; message?: string }) => ({
    path: err.instancePath || '/',
    message: err.message ?? 'Unknown validation error',
  }));

  return { valid: false, errors };
}
