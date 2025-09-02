import multer from "multer";
import {v2 as cloudinary} from 'cloudinary';
import { CloudinaryStorage } from "multer-storage-cloudinary";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


//category image upload
export const categoryImageUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "/azushop-api/category/image-upload"
    },
  }),
});


//product image upload
export const productImageUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "/azushop-api/product/image-upload"
    },
  }),
});


//users image upload
export const userImageUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "azushop-api/user/image-upload"
    },
  }),
});

