import Joi from "joi";


export const createProductValidator = Joi.object({
  admin: Joi.string().required(),
  name: Joi.string().max(100).required(),
  slug: Joi.string().optional(),
  description: Joi.string().required(),
  price: Joi.number().min(0).required(),
  discountPrice: Joi.number().min(0).optional(),
  stock: Joi.number().integer().min(0).default(0),
  category: Joi.string().required(),
  brand: Joi.string().optional(),
  images: Joi.array().items(Joi.string().required()),
  videos: Joi.array().items(Joi.string().uri()),
  tags: Joi.array().items(Joi.string()),
  variants: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      options: Joi.array().items(Joi.string()).required(),
    })
  ),
  specs: Joi.object().pattern(Joi.string(), Joi.string()),
  attributes: Joi.object().pattern(Joi.string(), Joi.string()),
  ratings: Joi.number().min(0).max(5).default(0),
  numReviews: Joi.number().integer().min(0).default(0),
  status: Joi.string().valid("draft", "published", "archived").default("published"),
  isActive: Joi.boolean().default(true),
});



//update product
export const updateProductValidator = Joi.object({
  name: Joi.string().max(100),
  slug: Joi.string().lowercase(),
  sku: Joi.string(),
  description: Joi.string(),
  price: Joi.number().min(0),
  discountPrice: Joi.number().min(0),
  stock: Joi.number().integer().min(0),
  category: Joi.string(),
  brand: Joi.string(),
  images: Joi.array().items(Joi.string().uri()),
  videos: Joi.array().items(Joi.string().uri()),
  tags: Joi.array().items(Joi.string()),
  variants: Joi.array().items(
    Joi.object({
      name: Joi.string(),
      options: Joi.array().items(Joi.string()),
    })
  ),
  specs: Joi.object().pattern(Joi.string(), Joi.string()),
  attributes: Joi.object().pattern(Joi.string(), Joi.string()),
  ratings: Joi.number().min(0).max(5),
  numReviews: Joi.number().integer().min(0),
  status: Joi.string().valid("draft", "published", "archived"),
  isActive: Joi.boolean(),
}).min(1);                          //will ensure at least one field being provided




