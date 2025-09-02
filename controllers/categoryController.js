import { categoryModel } from "../models/categoryModel.js";
import { createCategoryValidator } from "../validators/categoryValidator.js";



//add a category
export const createCategory = async (req, res, next) => {
  try {

    //dynamically accept Cloudinary upload or direct image URL
    const image = req.file?.path || req.body.image;

    const { error, value } = createCategoryValidator.validate({
      ...req.body,
      image
    }, { abortEarly: false });
    if (error) {
      return res.status(422).json({ message: error.message })
    };

    //save category
    const incomingCategory = await categoryModel.create({
      ...value,
      admin: req.auth.id
    });
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: incomingCategory
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message || 'Unknown error',
    });
  }
}


//get all tracks
export const getAllTracks = async (req, res) => {
  try {
    // Fetch tracks with related data
    const tracks = await trackModel
      .find()
      .populate({
        path: 'admin', //ref in trackModel
        select: 'firstName lastName email role contact isVerified lastLogin createdAt updatedAt profileImage location description resetTokenExpires resetToken'
      })
      .populate({
        path: 'courses', //ref in trackModel
        // select: '_id admin track title stacks image createdAt updatedAt'
        select: '-_v'
      })
      .populate({
        path: 'ratings', //ref in trackModel
        // select: '_id learner track rating review createdAt updatedAt'
        select: '-_v'
      })
      .sort({ createdAt: -1 }); // Latest first

    res.status(200).json({
      success: true,
      count: tracks.length,
      tracks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//get track by id
export const getTrackById = async (req, res) => {
  try {

    const getTrackById = await trackModel.findById(req.params.id).exec();
    if (!getTrackById) {
      return res.status(404).json({ message: "Track not found" })
    };

    res.status(200).json(getTrackById);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//get tracks by one admin
export const getAdminTracks = async (req, res) => {
  try {
    //find the admin id
    const admin = req.auth.id
    //check if admin has posted tracks
    const tracks = await trackModel.find({ admin }).exec();
    if (!tracks) {
      return res.status(404).json({ message: "No admin data found!" })
    };
    res.status(200).json(tracks);

  } catch (error) {
    res.status(500).json({ error: error.message });

  }
};


//update track
export const updateTrack = async (req, res, next) => {
  try {

    // Dynamically accept Cloudinary upload or direct image URL
    const image = req.file?.path || req.body.image;

    // Validate request body
    const { error, value } = updateTrackValidator.validate({
      ...req.body, image
    });
    if (error) {
      return res.status(422).json({ message: error.details[0].message });
    }

    // Update the track
    const result = await trackModel.findByIdAndUpdate(req.params.id, value, {
      new: true,
      runValidators: true,
    });

    // Check if the track exists
    if (!result) {
      return res.status(404).json({ message: "Track not found" });
    }

    // Return the updated track
    res.status(200).json({
      success: true,
      message: 'Track updated successfully',
      track: result,
    });
  } catch (error) {
    next(error);
  }
};


//delete track
export const deleteTrack = async (req, res) => {
  try {
    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    } //or i can just add isAuthorised at the router side

    const trackId = req.params.id;

    const track = await trackModel.findById(trackId);
    if (!track) {
      return res.status(404).json({ message: "Track not found!" });
    };


    // Delete associated courses
    await courseModel.deleteMany({ track: trackId });

    // Delete associated ratings
    await ratingModel.deleteMany({ track: trackId });

    // Delete the track itself
    await trackModel.findByIdAndDelete(trackId);

    res.json({ message: "Track and associated data deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


//search tracks
export const searchTracks = async (req, res, next) => {
  try {
    const {
      name = '',
      instructor = '',
      duration = '',
      minPrice = 0,
      maxPrice = 1000000,
      sortBy = 'createdAt', // default sort field
      order = 'desc'         // default order
    } = req.query;

    const query = {
      ...(name && { name: { $regex: name, $options: 'i' } }),
      ...(instructor && { instructor: { $regex: instructor, $options: 'i' } }),
      ...(duration && { duration }),
      price: {
        $gte: Number(minPrice),
        $lte: Number(maxPrice) || 1000000
      }
    };

    // Determine sorting logic
    const sortField = sortBy;
    const sortOrder = order === 'asc' ? 1 : -1;

    const tracks = await trackModel.find(query)
      .sort({ [sortField]: sortOrder })
      .lean();

    res.status(200).json({
      success: true,
      count: tracks.length,
      data: tracks
    });
  } catch (error) {
    next(error);
  }
};





//OR
// export const searchTracks = async (req, res, next) => {
//   try {
//     //parse query parameters
//     const { name, instructor, minPrice, maxPrice } = req.query;

//     if (name) {
//       query.name = { $regex: name, $options: "i" };
//     }

//     if (instructor) {
//       query.instructor = { $regex: instructor, $options: "i" };
//     }

//     if (duration) {
//       query.duration = { $regex: duration, $options: "i" };
//     }

//     if (minPrice || maxPrice) {
//       query.price = {};
//       if (minPrice) query.price.$gte = Number(minPrice);
//       if (maxPrice) query.price.$lte = Number(maxPrice);
//     }

//     const results = await trackModel.find(query).populate("admin", "fullName email");

//     res.status(200).json(results);
//   } catch (error) {
//     next(error);
//   }
// };





