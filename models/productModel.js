import { Schema, model, Types } from "mongoose";
import slugify from "slugify";
import normalize from "normalize-mongoose";
import { categoryModel } from "./categoryModel.js";



const productSchema = new Schema({
  admin: {
    type: Types.ObjectId,
    ref: "User",             //will track which admin created it
    required: true,
  },

  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },

  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },

  sku: {
    type: String,
    unique: true,        //stock keeping unit for internal product tracking
    sparse: true
    // required: true,
  },

  description: {
    type: String,
    required: true,
    trim: true,
  },

  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  },

  discountPrice: {
    type: Number,
    min: 0,
  },

  stock: {
    type: Number,
    default: 0,
  },

  category: {
    type: Types.ObjectId,
    ref: "Category",
    required: true,
  },

  brand: {
    type: String,      //e.g. Apple, Samsung, Rolex, Canon, Caveman
    trim: true,
  },

  images: [
    {
      type: String,
    },
  ],

  videos: [
    {
      type: String,      //optional product demo or review videos
    },
  ],

  tags: [
    {
      type: String,      //keywords like "gaming laptop", "Android", "luxury". improves search/filter experience.
    },
  ],

  variants: [
    {
      name: { type: String },       //e.g. Colour, Size, Storage
      options: [{ type: String }],  //e.g. ["Red", "Blue"] or ["128GB", "256GB"]
    },
  ],

  specs: {               //structured attributes for electronics
    type: Map,
    of: String,
    default: {},         //e.g. { cpu: "Intel i7", ram: "8GB", battery: "5000mAh" }
  },

  attributes: {          //fallback flexible object for extra variations (clothes, watches)
    type: Map,
    of: String,
    default: {},
  },

  ratings: {
    type: Number,
    default: 0,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot exceed 5']
  },

  numReviews: {
    type: Number,
    default: 0,            //number of reviews received
  },

  status: {
    type: String,
    enum: ["draft", "published", "archived"],      //product visibility
    default: "published",
  },

  isActive: {
    type: Boolean,
    default: true,              //for soft delete toggle
  },

  deletedBy: {
    type: Types.ObjectId,
    ref: "User",                //will track the admin who deleted the product
    default: null,
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});



//indexes (for faster search/filter)
productSchema.index({ name: "text", description: "text" });    //full-text search
productSchema.index({ category: 1, isActive: 1 });             //filtering by category + active
productSchema.index({ price: 1 });                             //sorting by price


//virtual field for checking if product is in stock
productSchema.virtual("inStock").get(function () {
  return this.stock > 0;
});


//virtual field for calculating discount percentage
productSchema.virtual('discountPercentage').get(function () {
  if (this.discountPrice && this.discountPrice < this.price) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});



//auto-generating slug from name
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});


//auto-generating SKU if missing
productSchema.pre("save", async function (next) {
  if (!this.sku) {
    let categoryCode = "GEN";      //fallback
    try {
      if (this.category) {
        const Category = this.model("Category");      //avoids circular imports
        const categoryDoc = await categoryModel.findById(this.category);
        if (categoryDoc && categoryDoc.name) {
          categoryCode = categoryDoc.name.substring(0, 3).toUpperCase();
        }
      }
    } catch (err) {
      //if category not found, leave GEN
    }

    const nameCode = this.name.replace(/\s+/g, "").substring(0, 5).toUpperCase();
    const uniqueCode = Date.now().toString().slice(-5);

    this.sku = `${categoryCode}-${nameCode}-${uniqueCode}`;
  }
  next();
});


productSchema.plugin(normalize);

export const productModel = model("Product", productSchema);
