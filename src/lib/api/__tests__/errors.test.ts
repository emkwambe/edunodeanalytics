import { describe, it, expect } from 'vitest';
import {
  ApiError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from '../errors';

describe('ApiError', () => {
  it('creates an error with message and status code', () => {
    const error = new ApiError('Something went wrong', 500, 'INTERNAL_ERROR');
    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.name).toBe('ApiError');
  });
});

describe('NotFoundError', () => {
  it('creates a 404 error with resource name', () => {
    const error = new NotFoundError('School');
    expect(error.message).toBe('School not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });

  it('includes ID in message when provided', () => {
    const error = new NotFoundError('Student', 'abc-123');
    expect(error.message).toBe("Student with id 'abc-123' not found");
  });
});

describe('ValidationError', () => {
  it('creates a 400 error with validation message', () => {
    const error = new ValidationError('Invalid input');
    expect(error.message).toBe('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('includes field errors when provided', () => {
    const error = new ValidationError('Validation failed', {
      email: 'Invalid email format',
      name: 'Name is required',
    });
    expect(error.fields).toEqual({
      email: 'Invalid email format',
      name: 'Name is required',
    });
  });
});

describe('UnauthorizedError', () => {
  it('creates a 401 error', () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe('Unauthorized');
    expect(error.statusCode).toBe(401);
  });

  it('accepts custom message', () => {
    const error = new UnauthorizedError('Token expired');
    expect(error.message).toBe('Token expired');
  });
});

describe('ForbiddenError', () => {
  it('creates a 403 error', () => {
    const error = new ForbiddenError();
    expect(error.message).toBe('Forbidden');
    expect(error.statusCode).toBe(403);
  });
});
