import Joi from "joi";

//manual user
export const registerUserValidator = Joi.object({
  fullName: Joi.string().trim().required().messages({
    'string.empty': 'Full name is required',
  }),

  email: Joi.string().email().lowercase().trim().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid address',
  }),

  role: Joi.string().optional(),

  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),

  confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your password',
  }),
}).with('password', 'confirmPassword');


//manual vendor
export const registerVendorValidator = Joi.object({
  fullName: Joi.string().trim().required().messages({
    'string.empty': 'Full name is required',
  }),

  email: Joi.string().email().lowercase().trim().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid address',
  }),

  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),

  confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your password',
  }),
}).with('password', 'confirmPassword');


//manual email + OTP verification
export const verifyUsersValidator = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Enter a valid email address',
  }),

  verificationToken: Joi.string()
    .required()
    .messages({
      'string.empty': 'Verification token is required',
    }),
});


export const resendVerificationValidator = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Enter a valid email address',
  }),
});


//login for users
export const loginValidator = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Enter a valid email address',
  }),

  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),
})


//forgot password
export const forgotPasswordValidator = Joi.object({
  email: Joi.string().email().required()
});


//reset password
export const resetPasswordValidator = Joi.object({
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.valid(Joi.ref("newPassword")).required()
});


//reset password with token acceptance in UI
// export const resetPasswordValidator = Joi.object({
//   token: Joi.string().required(),
//   newPassword: Joi.string().min(6).required(),
//   confirmPassword: Joi.valid(Joi.ref("newPassword")).required()
// });


//password update/change
export const updatePasswordValidator = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.valid(Joi.ref("newPassword")).required()
});




//users profile update
export const profileUpdateAdminValidator = Joi.object({
  firstName: Joi.string().trim().messages({
    'string.empty': 'First name is required',
  }),

  lastName: Joi.string().trim().messages({
    'string.empty': 'Last name is required',
  }),

  email: Joi.string().email().lowercase().trim().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid address',
  }),

  contact: Joi.string(),

  profilePicture: Joi.string(),

  location: Joi.string(),

  password: Joi.string().min(6).messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
  }),

  confirmPassword: Joi.any().valid(Joi.ref('password')).messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your password',
  }),
});
