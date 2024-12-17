const csrf = require('csurf');

// Configure CSRF protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Error handler for CSRF token validation
const handleCSRFError = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  
  // Handle CSRF token errors
  res.status(403).json({
    error: 'Invalid or missing CSRF token',
    details: 'Form submission rejected due to CSRF validation failure'
  });
};

module.exports = { csrfProtection, handleCSRFError };
