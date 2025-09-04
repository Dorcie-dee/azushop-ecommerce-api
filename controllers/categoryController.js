import { Types } from "mongoose";
import { categoryModel } from "../models/categoryModel.js";
import { createCategoryValidator, updateCategoryValidator } from "../validators/categoryValidator.js";
import { userModel } from "../models/userModel.js";



//add a category
export const createCategory = async (req, res, next) => {
  try {

    //dynamically accept Cloudinary upload or direct image URL
    const image = req.file?.path || req.body.image;

    //fixing "null" string from parentCategory in model and testing(form-data)
    let parentCategory = req.body.parentCategory;

    if (parentCategory === "null" ||
      parentCategory === "" ||
      parentCategory === undefined) {
      parentCategory = null;
    }
    // else {
    //   // If not a valid ObjectId, try to treat as slug
    //   if (!/^[0-9a-fA-F]{24}$/.test(parentCategory)) {
    //     const parentDoc = await categoryModel.findOne({ slug: parentCategory });
    //     parentCategory = parentDoc ? parentDoc._id : null;
    //   }
    // }


    const { error, value } = createCategoryValidator.validate({
      ...req.body,
      image,
      parentCategory,
    }, { abortEarly: false });

    if (error) {
      return res.status(422).json({ message: error.message })
    };

    //saving category
    const incomingCategory = await categoryModel.create({
      ...value,
      admin: req.auth.id
    });

    //populating admin details (e.g., fullName, email only)
    const populatedCategory = await categoryModel
      .findById(incomingCategory._id)
      .populate("admin", "fullName email")
      .populate("parentCategory", "name slug");   //will show parent details instead of just ID

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: populatedCategory
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message || 'Unknown error',
    });
  }
}



//get all categories
export const getAllCategories = async (req, res) => {
  try {
    //fetching categories with related data
    const categories = await categoryModel
      .find()
      .populate("admin", "fullName email")
      .populate("parentCategory", "name slug")
      .sort({ createdAt: -1 });     //latest first

    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


//get category by id
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;       //can be ObjectId or slug

    let category;

    if (Types.ObjectId.isValid(id)) {
      //search by ObjectId
      category = await categoryModel
        .findById(id)
        .exec();
    } else {
      //search by slug
      category = await categoryModel
        .findOne({ slug: id })
        .exec();
    }

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(category);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


//update category
export const updateCategory = async (req, res, next) => {
  try {

    //dynamically accept Cloudinary upload or direct image URL
    const image = req.file?.path || req.body.image;

    const { id } = req.params;       //can be ObjectId or slug

    //fixing "null" string from parentCategory in model and testing(form-data)
    let parentCategory = req.body.parentCategory;

    if (parentCategory === "null" ||
      parentCategory === "" ||
      parentCategory === undefined) {
      parentCategory = null;
    }


    // Validate request body
    const { error, value } = updateCategoryValidator.validate({
      ...req.body, image, parentCategory
    });
    if (error) {
      return res.status(422).json({
        message: error.details[0].message
      });
    }

    //will always set admin to the currently logged-in admin
    const updateData = {
      ...value,
      admin: req.auth.id,
    };


    let result;

    if (Types.ObjectId.isValid(id)) {
      //search by ObjectId
      result = await categoryModel
        .findById(id)
        .exec();
    } else {
      //search by slug
      result = await categoryModel
        .findOne({ slug: id })
        .exec();
    }

    //update the category
    const update = await categoryModel.findByIdAndUpdate(result, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("admin", "fullName email")
      .populate("parentCategory", "name slug");

    //check if the category exists
    if (!result) {
      return res.status(404).json({ message: "Category not found" });
    }

    //return the updated track
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category: update,
    });

  } catch (error) {
    next(error);
  }
};


//delete category
export const deleteCategory = async (req, res) => {
  try {
    if (!req.auth || !req.auth.id) {
      return res.status(401).json({
        message: "Unauthorized access"
      });
    } //or i can just add isAuthorised at the router side

    const categoryId = req.params.id;

    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        message: "Category not found!"
      });
    };

    const adminId = req.auth.id;
    const admin = await userModel.findById(adminId).select("fullName");

    //delete category
    await categoryModel.findByIdAndDelete(categoryId);

    res.json({
      message: "Category deleted successfully!",
      deletedBy: admin ? admin.fullName : "Unknown Admin",
      category
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};



//search categories
export const searchCategories = async (req, res, next) => {
  try {
    const {
      name = '',
      slug = '',
      duration = '',
      minPrice = 0,
      maxPrice = 1000000,
      sortBy = 'createdAt',              //default sort field
      order = 'desc'                     //default order
    } = req.query;

    const query = {
      ...(name && { name: { $regex: name, $options: 'i' } }),
      ...(slug && { slug: { $regex: instructor, $options: 'i' } }),
      ...(duration && { duration }),
      price: {
        $gte: Number(minPrice),
        $lte: Number(maxPrice) || 1000000
      }
    };

    // Determine sorting logic
    const sortField = sortBy;
    const sortOrder = order === 'asc' ? 1 : -1;

    const categories = await categoryModel.find(query)
      .sort({ [sortField]: sortOrder })
      .lean();

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });

  } catch (error) {
    next(error);
  }
};







