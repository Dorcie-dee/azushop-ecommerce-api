import { model, Schema, Types } from "mongoose";
import normalize from "normalize-mongoose";



const orderSchema = new Schema({
  orderNumber: { type: String, unique: true },  //auto-generated

  customerId: {
    type: Types.ObjectId,
    ref: "User"
  },

  items: [
    {
      productId: { type: Types.ObjectId, ref: "Product", required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true },
      sku: { type: String },
      variants: { type: Map, of: String },  //size, color
      subtotal: { type: Number },
    },
  ],

  tax: { type: Number, default: 0 },

  shippingFee: { type: Number, default: 0 },

  discountPrice: { type: Number, default: 0 },

  grandTotal: { type: Number, required: true },

  paymentMethod: {
    type: String,
    enum: ["card", "paypal", "mobileMoney", "cashOnDelivery"],
    required: true,
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },

  paymentId: { type: String },

  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    region: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String },
    shippingMethod: {type: String}
  },

  trackingNumber: {type: String},

  billingAddress: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    zipCode: { type: String }
  },

  orderStatus: {
    type: String,
    enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"],
    default: "pending",
  },

  notes: { type: String }

}, {
  timestamps: true
});


orderSchema.plugin(normalize);

export const orderModel = model("Order", orderSchema);