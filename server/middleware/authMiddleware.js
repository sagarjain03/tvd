import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

/**
 * Middleware to protect routes by verifying JWT access token
 * Token should be sent in Authorization header as: Bearer <token>
 * Sets req.user to the authenticated user
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Look for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Check if token exists
  if (!token) {
    res.status(401);
    throw new Error("Not authorized - no token provided");
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized - invalid or expired token");
  }

  // Get user from database
  req.user = await User.findById(decoded.id).select("-password -refreshToken");

  if (!req.user) {
    res.status(401);
    throw new Error("User not found");
  }

  next();
});
