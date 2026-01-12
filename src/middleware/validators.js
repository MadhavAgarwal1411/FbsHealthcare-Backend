import { body, validationResult } from 'express-validator';

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Registration validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Please provide a valid phone number (10-15 digits)'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .optional()
    .isIn(['admin', 'employee'])
    .withMessage('Role must be either admin or employee'),
  
  body('loginStartTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('Login start time must be in HH:MM or HH:MM:SS format'),
  
  body('loginEndTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('Login end time must be in HH:MM or HH:MM:SS format'),
  
  handleValidationErrors,
];

// Login validation rules
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors,
];

// Update user validation rules
const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Please provide a valid phone number (10-15 digits)'),
  
  body('role')
    .optional()
    .isIn(['admin', 'employee'])
    .withMessage('Role must be either admin or employee'),
  
  body('loginStartTime')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '') return true;
      return /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(value);
    })
    .withMessage('Login start time must be in HH:MM or HH:MM:SS format'),
  
  body('loginEndTime')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '') return true;
      return /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(value);
    })
    .withMessage('Login end time must be in HH:MM or HH:MM:SS format'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  handleValidationErrors,
];

export {
  registerValidation,
  loginValidation,
  updateUserValidation,
  handleValidationErrors,
};
