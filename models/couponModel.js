import { Schema, model } from "mongoose";
import normalize from "normalize-mongoose";


const couponSchema = new Schema({
  code: { type: String, required: true, unique: true },  //e.g. WELCOME108

  discountType: { type: String, enum: ["percentage", "fixed"], required: true },
  discountValue: { type: Number, required: true },    //10 for 10% or $10

  expiryDate: { type: Date },

  isActive: { type: Boolean, default: true },
  
}, { timestamps: true });

couponSchema.plugin(normalize)

export const couponModel = model("Coupon", couponSchema);



// POST /api/orders/apply-coupon
// Takes a couponCode and returns recalculated totals (without creating the order yet).

// Track Order
// GET /api/orders/track/:trackingNumber
// Public endpoint to check status by tracking number.

// Refund Order
// POST /api/orders/:id/refund
// Admin (or payment service webhook) marks an order as refunded.