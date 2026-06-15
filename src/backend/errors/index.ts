export abstract class BaseError extends Error {
  public abstract readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: Record<string, string[]>;

  constructor(message: string, errorCode: string, details?: Record<string, string[]>) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends BaseError {
  public readonly statusCode = 400;
  constructor(message: string = "ভুল ইনপুট দেওয়া হয়েছে।", details?: Record<string, string[]>) {
    super(message, "VALIDATION_ERROR", details);
  }
}

export class AuthenticationError extends BaseError {
  public readonly statusCode = 401;
  constructor(message: string = "আপনার আইডি বা পাসওয়ার্ড ভুল।") {
    super(message, "AUTHENTICATION_ERROR");
  }
}

export class ForbiddenError extends BaseError {
  public readonly statusCode = 403;
  constructor(message: string = "আপনার এই কাজটি করার অনুমতি নেই।") {
    super(message, "FORBIDDEN_ACTION");
  }
}

export class NotFoundError extends BaseError {
  public readonly statusCode = 404;
  constructor(message: string = "তথ্যটি খুঁজে পাওয়া যায়নি।") {
    super(message, "NOT_FOUND");
  }
}

export class ConflictError extends BaseError {
  public readonly statusCode = 409;
  constructor(message: string = "তথ্যটি ইতিমধ্যে সিস্টেমে রয়েছে।") {
    super(message, "CONFLICT_ERROR");
  }
}
