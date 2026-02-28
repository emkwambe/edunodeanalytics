import { describe, it, expect } from 'vitest';
import {
  validateRequired,
  validateUUID,
  parseIntParam,
  parseEnumParam,
} from '../validation';
import { ValidationError } from '../errors';

describe('validateRequired', () => {
  it('passes when all required fields are present', () => {
    expect(() =>
      validateRequired({ name: 'Test', email: 'test@test.com' }, ['name', 'email'])
    ).not.toThrow();
  });

  it('throws ValidationError when fields are missing', () => {
    expect(() =>
      validateRequired({ name: 'Test' }, ['name', 'email'])
    ).toThrow(ValidationError);
  });

  it('throws for empty strings', () => {
    expect(() =>
      validateRequired({ name: '' }, ['name'])
    ).toThrow(ValidationError);
  });

  it('throws for null values', () => {
    expect(() =>
      validateRequired({ name: null }, ['name'])
    ).toThrow(ValidationError);
  });
});

describe('validateUUID', () => {
  it('passes for valid UUIDs', () => {
    expect(() =>
      validateUUID('550e8400-e29b-41d4-a716-446655440000', 'id')
    ).not.toThrow();
  });

  it('throws for invalid UUIDs', () => {
    expect(() => validateUUID('not-a-uuid', 'id')).toThrow(ValidationError);
    expect(() => validateUUID('123', 'id')).toThrow(ValidationError);
  });
});

describe('parseIntParam', () => {
  it('parses valid integers', () => {
    expect(parseIntParam('42', 10)).toBe(42);
    expect(parseIntParam('0', 10)).toBe(0);
  });

  it('returns default for null', () => {
    expect(parseIntParam(null, 10)).toBe(10);
  });

  it('returns default for invalid strings', () => {
    expect(parseIntParam('abc', 10)).toBe(10);
    expect(parseIntParam('', 10)).toBe(10);
  });
});

describe('parseEnumParam', () => {
  const allowed = ['asc', 'desc'] as const;

  it('returns value when valid', () => {
    expect(parseEnumParam('asc', allowed)).toBe('asc');
    expect(parseEnumParam('desc', allowed)).toBe('desc');
  });

  it('returns default for null', () => {
    expect(parseEnumParam(null, allowed, 'asc')).toBe('asc');
  });

  it('returns default for invalid values', () => {
    expect(parseEnumParam('invalid', allowed, 'asc')).toBe('asc');
  });

  it('returns undefined when no default', () => {
    expect(parseEnumParam(null, allowed)).toBeUndefined();
  });
});
