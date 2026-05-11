import express from "express";
import asyncHandler from "express-async-handler";
import { protect } from "../middleware/authMiddleware.js";
import { uploadProfilePhoto, handleUploadError } from "../middleware/uploadMiddleware.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// @desc    Upload profile photo to Cloudinary
// @route   POST /api/upload/profile-photo
// @access  Private
router.post(
  "/profile-photo",
  protect,
  uploadProfilePhoto,
  handleUploadError,
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }

    const user = await User.findById(req.user._id);

    // Delete old photo from Cloudinary if exists
    if (user.profilePhoto) {
      try {
        // Extract public ID from Cloudinary URL
        const urlParts = user.profilePhoto.split("/");
        const filename = urlParts[urlParts.length - 1];
        const publicId = filename.split(".")[0];
        await cloudinary.uploader.destroy(`mysticmatch/profiles/${publicId}`);
      } catch (err) {
        console.warn("Could not delete old profile photo:", err.message);
      }
    }

    // Update user with new photo URL
    user.profilePhoto = req.file.path;
    await user.save();

    res.json({
      success: true,
      profilePhoto: req.file.path,
    });
  })
);

export default router;
