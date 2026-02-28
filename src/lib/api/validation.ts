import { ValidationError } from './errors';

export function validateRequired(
  data: Record<string, unknown>,
  fields: string[]
): void {
  const missing = fields.filter(
    (field) => data[field] === undefined || data[field] === null || data[field] === ''
  );
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      Object.fromEntries(missing.map((f) => [f, 'Required']))
    );
  }
}

export function validateUUID(value: string, fieldName: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`Invalid ${fieldName} format`, {
      [fieldName]: 'Must be a valid UUID',
    });
  }
}

export function parseIntParam(value: string | null, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function parseEnumParam<T extends string>(
  value: string | null,
  allowedValues: readonly T[],
  defaultValue?: T
): T | undefined {
  if (!value) return defaultValue;
  return allowedValues.includes(value as T) ? (value as T) : defaultValue;
}
