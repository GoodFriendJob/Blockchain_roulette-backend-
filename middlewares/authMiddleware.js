const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const User = require("../models/User");
const redisClient = require('../utils/cache');

/**
 * Middleware to authenticate and validate JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.authenticateJWT = async (req, res, next) => {
  try {
    // Check for Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        error: 'Authorization header required' 
      });
    }

    // Extract and validate token format
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Valid token required' 
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check token expiration
      if (decoded.exp < Date.now() / 1000) {
        return res.status(401).json({ 
          success: false,
          error: 'Token has expired' 
        });
      }

      // Check if token is revoked (if Redis is enabled)
      if (redisClient.isReady) {
        const isRevoked = await redisClient.get(`revokedToken_${decoded.jti}`);
        if (isRevoked === 'revoked') {
          return res.status(401).json({ 
            success: false,
            error: 'Token has been revoked' 
          });
        }
      }

      // Fetch current user data
      const user = await User.findById(decoded.id)
        .select('-password')
        .lean();

      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(401).json({ 
          success: false,
          error: 'User account is not active' 
        });
      }

      // Attach user to request object
      req.user = {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        user_level: user.user_level
      };

      next();
    } catch (err) {
      logger.error(`JWT verification error: ${err.message}`);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  } catch (error) {
    logger.error(`Authentication middleware error: ${error.message}`);
    return res.status(500).json({ 
      success: false,
      error: 'Authentication failed' 
    });
  }
};

/**
 * Optional authentication middleware - doesn't require auth but will process token if present
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').lean();

    if (user && user.status === 'active') {
      req.user = {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        user_level: user.user_level
      };
    }

    next();
  } catch (error) {
    // Don't throw error for optional auth
    logger.warn(`Optional auth error: ${error.message}`);
    next();
  }
};


