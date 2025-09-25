const xss = require('xss');

/**
 * Sanitize request body to prevent XSS attacks
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? xss(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
};

/**
 * Sanitize specific fields that are commonly targeted
 */
const sanitizeUserInput = (req, res, next) => {
  const fieldsToSanitize = [
    'firstName', 'lastName', 'email', 'phone',
    'name', 'description', 'brand', 'notes',
    'street', 'city', 'state', 'zipCode', 'country'
  ];

  const sanitizeFields = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeFields(item));
    }

    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (fieldsToSanitize.includes(key) && typeof obj[key] === 'string') {
          // Remove HTML tags and encode special characters
          sanitized[key] = xss(obj[key], {
            whiteList: {}, // Remove all HTML tags
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script']
          });
        } else {
          sanitized[key] = sanitizeFields(obj[key]);
        }
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeFields(req.body);
  }
  next();
};

/**
 * Remove potentially dangerous characters from strings
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate and sanitize MongoDB ObjectId
 */
const sanitizeObjectId = (req, res, next) => {
  const mongoose = require('mongoose');
  
  const sanitizeId = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeId(item));
    }

    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (key.endsWith('Id') || key === 'id' || key === '_id') {
          // Validate MongoDB ObjectId format
          if (typeof obj[key] === 'string' && !mongoose.Types.ObjectId.isValid(obj[key])) {
            return res.status(400).json({
              success: false,
              message: `Invalid ${key} format`
            });
          }
          sanitized[key] = obj[key];
        } else {
          sanitized[key] = sanitizeId(obj[key]);
        }
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeId(req.body);
  }
  if (req.params) {
    req.params = sanitizeId(req.params);
  }
  next();
};

module.exports = {
  sanitizeInput,
  sanitizeUserInput,
  sanitizeString,
  sanitizeObjectId
};
