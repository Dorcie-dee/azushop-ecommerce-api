import Joi from "joi";

export const createCategoryValidator = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      "string.base": `"name" should be a type of 'text'`,
      "string.empty": `"name" cannot be empty`,
      "string.min": `"name" should have at least 2 characters`,
      "string.max": `"name" should have at most 50 characters`,
      "any.required": `"name" is required`,
    }),

  parentCategory: Joi.string()
    .optional()
    .allow(null, "")
    .messages({
      "string.base": `"parentCategory" should be a valid ID string`,
    }),

  image: Joi.string()
    .uri()
    .optional()
    .messages({
      "string.uri": `"image" must be a valid URL`,
    }),

  isActive: Joi.boolean().default(true),
});




export const updateCategoryValidator = Joi.object({
  name: Joi.string().min(2).max(50),
  parentCategory: Joi.string().optional().allow(null, ""),
  image: Joi.string().uri().optional(),
  isActive: Joi.boolean(),
}).min(1);         //must provide at least one field to update