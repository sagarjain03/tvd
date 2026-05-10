import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
} from "../utils/generateToken.js";

/**
 * @desc    Register new user with email and password
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("All fields (name, email, password) are required");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists with this email");
  }

  // Create user
  const user = await User.create({ name, email, password });

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to database
  user.refreshToken = refreshToken;
  await user.save();

  // Set refresh token as cookie
  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    success: true,
    user,
    accessToken,
  });
});

/**
 * @desc    Login user with email and password
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  // Find user (need to select password field as it's not returned by default)
  const user = await User.findOne({ email }).select("+password");

  if (!user || !user.password) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  // Compare password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshTokenVal = generateRefreshToken(user._id);

  // Save refresh token to database
  user.refreshToken = refreshTokenVal;
  await user.save();

  // Set refresh token as cookie
  setRefreshTokenCookie(res, refreshTokenVal);

  // Return user without password
  const userResponse = user.toJSON();

  res.json({
    success: true,
    user: userResponse,
    accessToken,
  });
});

/**
 * @desc    Logout user (clear tokens)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.clearCookie("refreshToken");

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * @desc    Refresh access token using refresh token from cookie
 * @route   POST /api/auth/refresh-token
 * @access  Public (uses refresh token cookie)
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    res.status(401);
    throw new Error("No refresh token provided");
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired refresh token");
  }

  // Find user and verify refresh token matches
  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== token) {
    res.status(401);
    throw new Error("Invalid refresh token");
  }

  // Generate new access token
  const newAccessToken = generateAccessToken(user._id);

  res.json({
    success: true,
    accessToken: newAccessToken,
  });
});

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    success: true,
    user,
  });
});

/**
 * @desc    Google OAuth callback handler
 * @route   GET /api/auth/google/callback
 * @access  Public
 * Note: This is called after Passport.js authenticates with Google
 */
export const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshTokenVal = generateRefreshToken(user._id);

  // Save refresh token to database
  user.refreshToken = refreshTokenVal;
  await user.save();

  // Set refresh token as cookie
  setRefreshTokenCookie(res, refreshTokenVal);

  // Redirect to frontend with access token in URL
  // Frontend will extract token and store in localStorage/memory
  const redirectUrl = `${process.env.CLIENT_URL}/auth/callback?token=${accessToken}`;
  res.redirect(redirectUrl);
});
