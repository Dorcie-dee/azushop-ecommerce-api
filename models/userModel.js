import { Schema, model } from "mongoose";
import normalize from 'normalize-mongoose'

const userSchema = new Schema({
  fullName: { 
    type: String, 
    required: true 
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  contact: { 
    type: String,
    trim: true 
  },

  password: { 
    type: String
  },

  profilePicture: { 
    type: String, 
    default: "" 
  },

  role: { 
    type: String, 
    enum: ['vendor', 'user', 'admin'] ,
    default: 'user',
    required: true
  },

  //email verification
    isEmailVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
  },
  verificationTokenExpiresAt: {
    type: Date,
  },

  //login tracking
  lastLogin: {
    type: Date,
    default: Date.now,
  },

  resendAttempts: { type: Number, default: 0 },

  lastResendAt: { type: Date },

  //password reset
  resetToken: { type: String },
  resetTokenExpires: { type: Date }, 

  location: {type: String},



  //OAUTH FIELDS
  provider: {
    type: String,    //"google", "facebook", "local"
    default: "local",
  },

  providerId: {
    type: String,    //the unique ID from Google or Facebook  
  },

  accessToken: {
    type: String
  },

  refreshToken: {
    type: String
  },


  //app-level tokens
  appRefreshToken: {
    type: String      //my backend jwt refresh token
  },

  appRefreshTokenExpires: {
    type: Date   //expiry for my backend refresh token
  },

}, { timestamps: true });

userSchema.plugin(normalize);

export const userModel = model('User', userSchema)