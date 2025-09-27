import Joi from "joi";

export const createOrderValidator = Joi.object({
  // customerId: Joi.string()
  //   .hex()
  //   .length(24)
  //   .optional()
  //   .messages({
  //     "string.empty": "Customer ID is required",
  //     "string.length": "Customer ID must be a valid ObjectId",
  //   }),

  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string()
          .hex()
          .length(24)
          .required()
          .messages({
            "string.empty": "Product ID is required",
            "string.length": "Product ID must be a valid ObjectId",
          }),
        name: Joi.string().optional(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().positive().optional(),
        sku: Joi.string().optional(),
        variants: Joi.object().pattern(Joi.string(), Joi.string()).optional(), 
        subtotal: Joi.number().optional(),
      })
    )
    .min(1)
    .required(),

  tax: Joi.number().min(0).default(0),
  shippingFee: Joi.number().min(0).default(0),
  discountPrice: Joi.number().min(0).default(0),

  paymentMethod: Joi.string()
    .valid("card", "paypal", "mobileMoney", "cashOnDelivery")
    .required(),

  paymentId: Joi.string().optional(),

  shippingAddress: Joi.object({
    fullName: Joi.string().required(),
    phone: Joi.string().required(),
    street: Joi.string().required(),
    city: Joi.string().required(),
    region: Joi.string().required(),
    country: Joi.string().required(),
    zipCode: Joi.string().optional(),
    shippingMethod: Joi.string().optional(),
  }).required(),

  billingAddress: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    country: Joi.string().optional(),
    zipCode: Joi.string().optional(),
  }).optional(),

  orderStatus: Joi.string().valid(
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded"
  ).default("pending"),

  notes: Joi.string().optional(),
});



export const updateOrderValidator = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().hex().length(24),
      name: Joi.string(),
      quantity: Joi.number().integer().min(1),
      price: Joi.number().min(0),
      sku: Joi.string(),
      variants: Joi.object().pattern(Joi.string(), Joi.string()),
      subtotal: Joi.number().min(0),
    })
  ),

  tax: Joi.number().min(0),

  shippingFee: Joi.number().min(0),

  discountPrice: Joi.number().min(0),

  grandTotal: Joi.number().min(0),

  paymentMethod: Joi.string().valid("card", "paypal", "mobileMoney", "cashOnDelivery"),

  paymentStatus: Joi.string().valid("pending", "paid", "failed", "refunded"),

  paymentId: Joi.string(),

  shippingAddress: Joi.object({
    fullName: Joi.string(),
    phone: Joi.string(),
    street: Joi.string(),
    city: Joi.string(),
    region: Joi.string(),
    country: Joi.string(),
    zipCode: Joi.string().allow("", null),
    shippingMethod: Joi.string()
  }),

  trackingNumber: Joi.string(),

  billingAddress: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    country: Joi.string(),
    zipCode: Joi.string()
  }),

  orderStatus: Joi.string().valid(
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded"
  ),

  notes: Joi.string()
}).min(1);

