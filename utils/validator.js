const { body, param, query, validationResult } = require("express-validator");

// Example: Validate user registration input
const validateUserRegistration = [
  body("username").isString().withMessage("Username must be a string"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// Example: Validate user ID in request params
const validateUserId = [
  param("userId").isUUID().withMessage("Invalid user ID format"),
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validateUserRegistration,
  validateUserId,
  handleValidationErrors,
};
