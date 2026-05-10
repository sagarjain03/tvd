import express from "express";
import passport from "passport";
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  googleCallback,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Basic Auth Routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.post("/refresh-token", refreshToken);
router.get("/me", protect, getMe);

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/login` }),
  googleCallback
);

export default router;
