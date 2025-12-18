/**
 * Custom error classes for better error handling
 */

export class MiauIndexError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MiauIndexError';
  }
}

export class ProviderError extends MiauIndexError {
  constructor(
    public provider: string,
    message: string
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'ProviderError';
  }
}

export class ValidationError extends MiauIndexError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(field ? `Validation error in ${field}: ${message}` : message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends MiauIndexError {
  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends MiauIndexError {
  constructor(public retryAfter?: number) {
    super(`Rate limit exceeded${retryAfter ? `, retry after ${retryAfter}s` : ''}`);
    this.name = 'RateLimitError';
  }
}
