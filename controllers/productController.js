import { Types } from "mongoose";
import { categoryModel } from "../models/categoryModel.js";
import { productModel } from "../models/productModel.js";
import { createProductValidator, updateProductValidator } from "../validators/productValidator.js";
import { userModel } from "../models/userModel.js";



export const createProduct = async (req, res) => {
  try {

    //dynamically accept Cloudinary upload or direct image URL
    // const image = req.file?.path || req.body.image;

    //validate request body
    const { error, value } = createProductValidator.validate({
      ...req.body,
      images: req.files?.map((file) => {
        return file.filename
      }),
    }, {
      abortEarly: false,       //collect all errors
    });

    if (error) {
      return res.status(422).json({
        message: "Validation failed",
        errors: error.details.map((err) => err.message),
      });
    }


    //converting slug to ObjectId
    let categoryId = value.category;

    if (typeof value.category === "string" && !/^[0-9a-fA-F]{24}$/.test(value.category)) {
      const categoryDoc = await categoryModel.findOne({
        slug: value.category
      });

      if (!categoryDoc) {
        return res.status(404).json({
          message: "Category not found"
        });
      }
      categoryId = categoryDoc._id;
    }

    //creating product using only validated fields
    const incomingProduct = await productModel.create({
      ...value,
      category: categoryId,
      admin: req.auth.id
    });

    const populatedProduct = await productModel
      .findById(incomingProduct._id)
      .populate("admin", "fullName email")
      .populate("category", "name slug");   //will show parent details instead of just ID

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: populatedProduct,
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message || 'Unknown error',
    });
  }
};



//all products
export const getAllProducts = async (req, res) => {
  try {
    const allProducts = await productModel
      .find()
      .sort({ createdAt: -1 });     //latest first

    const categories = await categoryModel
      .populate("category", "name slug")

    res.status(200).json({
      success: true,
      count: allProducts.length,
      allProducts
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};



//single product
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;          //objectId or slug

    let items;

    if (Types.ObjectId.isValid(id)) {
      //search by ObjectId
      items = await productModel
        .findById(id)
        .exec();
    } else {
      //search by slug
      items = await productModel
        .findOne({ slug: id })
        .exec();
    }

    if (!items) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(items);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};



//only one admin/vendor's posted products
export const getVendorProducts = async (req, res) => {
  try {

    const userId = req.auth.id

    const items = await productModel
      .find({ admin: userId })                      //filtering by admin field
      // .populate("admin", "fullName email")       //shows vendor info
      .exec();

    if (!items || items.length === 0) {
      return res.status(404).json({
        message: "No products found for this vendor!"
      });
    }

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};



//updating product details
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;       //can be ObjectId or slug

    //validate request body
    const { error, value } = updateProductValidator.validate({
      ...req.body,
      images: req.files?.map((file) => {
        return file.filename
      }),
    });

    if (error) {
      return res.status(422).json({
        message: "Validation failed",
        errors: error.details.map((err) => err.message),
      });
    }

    let result;

    if (Types.ObjectId.isValid(id)) {
      //search by ObjectId
      result = await productModel
        .findById(id)
        .exec();
    } else {
      //search by slug
      result = await productModel
        .findOne({ slug: id })
        .exec();
    }

    //updating the product
    const update = await productModel.findByIdAndUpdate(result, value, {
      new: true,
      runValidators: true,
    })

    //checking if the product exists
    if (!result) {
      return res.status(404).json({ message: "Product not found!" });
    }

    //returning the updated track
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: update,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }

};



//detleting a product
export const deleteProduct = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.id) {
      return res.status(401).json({
        message: "Unauthorized access"
      });
    }

    const productId = req.params.id;

    const items = await productModel.findById(productId);
    if (!items) {
      return res.status(404).json({
        message: "Product not found!"
      });
    };

    const adminId = req.auth.id;
    const admin = await userModel.findById(adminId).select("fullName");

    //deleting product
    await productModel.findByIdAndDelete(productId);

    res.json({
      message: "Product deleted successfully!",
      deletedBy: admin ? admin.fullName : "Unknown Admin",
      items
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};



export const searchProducts = async (req, res) => {
  try {
    //parsing query parameters
    const {
      name = '',
      category = '',
      slug,                                 //keyword to search in slug
      sortBy,                               //sorting field: name, createdAt, etc.
      order = "asc",                        //asc or desc
      page = 1,                             //pagination: page number
      limit = 10,                            //pagination: items per page
      minPrice = 0,
      maxPrice = 1000000     //practical upper limit
    } = req.query;


    const filter = {};

    //searching by name or slug (case-insensitive)
    if (name) {
      filter.name = { $regex: name, $options: "i" }    //case-insensitive product name search
    };

    if (slug) {
      filter.slug = { $regex: slug, $options: "i" }
    };

    if (category) {
      filter.category = category
    };

    filter.price = {
      $gte: Number(minPrice),
      $lte: Number(maxPrice) || 1000000       //fallback for missing maxPrice
    };

    //sorting
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = order === "desc" ? -1 : 1;
    } else {
      sortOptions.createdAt = -1;               //default: newest first
    }

    //pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);


    const products = await productModel
      .find(filter)
      .populate("category", "name slug")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await productModel.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      data: products
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  };
};




