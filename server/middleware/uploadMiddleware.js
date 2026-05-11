import { upload } from "../config/cloudinary.js";

// Single profile photo upload middleware
export const uploadProfilePhoto = upload.single("profilePhoto");

// Error handler for multer and upload errors
export const handleUploadError = (err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 5MB.",
    });
  }
  if (err.message === "Invalid file type") {
    return res.status(400).json({
      success: false,
      message: "Only jpg, jpeg, png, and webp images are allowed.",
    });
  }
  next(err);
};
