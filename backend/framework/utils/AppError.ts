export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  /**
   * Optional extra fields merged into the JSON error body, e.g.
   * `{ missing_skills: [999] }` when selected skills do not exist.
   */
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
