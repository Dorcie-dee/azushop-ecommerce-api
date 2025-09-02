import { model, Schema, Types } from "mongoose";
import slugify from "slugify";
import normalize from "normalize-mongoose";


const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },

  slug: {   //used in frontend URLs & SEO friendly .../category/mens-clothing
    type: String,
    unique: true,
    lowercase: true
  },

  parentCategory: {    //allows nesting (e.g., "Phones" inside "Electronics")
    type: Types.ObjectId,
    ref: "Category",
    default: null
  },

  image: {           
    type: String
  },

  isActive: {     //will enable/disable categories without deleting them
    type: Boolean,
    default: true
  },

}, {timestamps: true})


//auto-generate slug from name
categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});


categorySchema.plugin(normalize);

export const categoryModel = model('Category', categorySchema)
