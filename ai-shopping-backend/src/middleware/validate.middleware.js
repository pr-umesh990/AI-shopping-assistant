import { errorResponse } from '../utils/apiResponse.js';

/**
 * Validate request body against a Joi schema.
 * Returns 400 with field-level errors if validation fails.
 * @param {import('joi').Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      errors: {
        wrap: {
          label: false,
        },
      },
    });

    if (error) {
      const errors = error.details.reduce((acc, detail) => {
        const field = detail.path.join('.');
        acc[field] = detail.message;
        return acc;
      }, {});

      return errorResponse(res, 400, 'Validation failed.', errors);
    }

    req.body = value;
    next();
  };
};

export default validate;
