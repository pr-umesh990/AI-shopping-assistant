import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Name is required.',
    'string.min'  : 'Name must be at least 2 characters long.',
    'string.max'  : 'Name cannot exceed 50 characters.',
    'any.required': 'Name is required.'
  }),
  email: Joi.string().email().required().messages({
    'string.empty'  : 'Email is required.',
    'string.email'  : 'Please enter a valid email address.',
    'any.required'  : 'Email is required.'
  }),
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase letter')
    .pattern(/[0-9]/, 'number')
    .required()
    .messages({
      'string.empty': 'Password is required.',
      'string.min': 'Password must be at least 8 characters long.',
      'string.pattern.name': 'Password must contain at least one {#name}.',
      'any.required': 'Password is required.'
    })
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required.',
    'string.email': 'Please enter a valid email address.',
    'any.required': 'Email is required.'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required.',
    'any.required': 'Password is required.'
  })
});
