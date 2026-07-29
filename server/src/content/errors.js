export class ContentValidationError extends Error {
  constructor(code, extras = {}) {
    super(code);
    this.name = 'ContentValidationError';
    this.code = code;
    this.extras = extras;
    this.status = 400;
  }

  toJSON() {
    return { error: this.code, ...this.extras };
  }
}

export function sendContentError(res, err) {
  if (err instanceof ContentValidationError) {
    return res.status(err.status).json(err.toJSON());
  }
  throw err;
}
