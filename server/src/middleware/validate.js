/**
 * Validation middleware
 * Checks for validation errors from express-validator
 */

const { validationResult } = require('express-validator');

/**
 * Middleware to validate request
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
}; 