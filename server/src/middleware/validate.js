import { validationResult } from 'express-validator';

/**
 * Middleware factory that executes validation chains and returns 400 if validation fails
 * @param {Array} validations - Array of express-validator validation chains
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    if (Array.isArray(validations)) {
      for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
      }
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  };
};

/**
 * Standalone middleware to check validationResult after route-level chains
 */
export const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    errors: errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    })),
  });
};

export default validate;
