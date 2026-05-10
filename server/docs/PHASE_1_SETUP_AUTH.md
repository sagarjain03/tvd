# Phase 1 — Project Setup & Authentication

## Overview

This is the foundation phase. Every other phase depends on this being solid.
By the end of Phase 1, the Express server is running, MongoDB is connected,
and a user can register, login, and access protected routes using JWT.

---

## Folder Structure to Create in This Phase

```
server/
├── config/
│   └── db.js
├── controllers/
│   └── authController.js
├── middleware/
│   ├── authMiddleware.js
│   └── errorMiddleware.js
├── models/
│   └── User.js
├── routes/
│   └── authRoutes.js
├── utils/
│   └── generateToken.js
├── .env
├── .env.example
├── .gitignore
└── server.js
```

---

## Dependencies to Install

```bash
npm init -y
npm install express mongoose dotenv bcryptjs jsonwebtoken cookie-parser cors passport passport-google-oauth20 express-async-handler
npm install --save-dev nodemon
```

**package.json scripts:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

---

## Environment Variables Required (Phase 1)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/mysticmatch
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=30d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=http://localhost:5173
```

---

## File-by-File Implementation

---

### `server.js` — Entry Point

```javascript
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "MysticMatch server is alive 🧛" });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

### `config/db.js` — MongoDB Connection

```javascript
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};
```

---

### `models/User.js` — Full User Schema

> Define the COMPLETE user schema here even though most fields won't be
> populated until later phases. This avoids schema migration issues later.

```javascript
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      minlength: 6,
      // Not required because Google OAuth users won't have a password
    },
    googleId: {
      type: String,
    },
    profilePhoto: {
      type: String,
      default: "",
    },

    // Filled in Phase 2 (Quiz)
    supernaturalType: {
      type: String,
      enum: ["Vampire", "Werewolf", "Witch", "Hybrid", null],
      default: null,
    },
    personalityTraits: {
      loyalty: { type: Number, default: 0 },
      aggression: { type: Number, default: 0 },
      empathy: { type: Number, default: 0 },
      strategy: { type: Number, default: 0 },
      dominance: { type: Number, default: 0 },
      emotionalDepth: { type: Number, default: 0 },
    },
    quizCompleted: {
      type: Boolean,
      default: false,
    },

    // Filled in Phase 3 (Story)
    storyProgress: {
      currentChapter: { type: Number, default: 1 },
      completed: { type: Boolean, default: false },
    },

    // Filled in Phase 4 (Matching)
    matches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Match" }],
    likedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    rejectedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    activityScore: { type: Number, default: 0 },

    // Filled in Phase 5 (Chat)
    // (handled via Match → Chat relationship)

    // Filled in Phase 6 (Gamification)
    darkSideProfile: {
      secret: { type: String, default: "" },
      originStory: { type: String, default: "" },
    },
    achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: "Achievement" }],
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: null },
    },

    // Location (Phase 4 optional)
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },

    refreshToken: { type: String },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Never return password in responses
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  return user;
};

userSchema.index({ location: "2dsphere" });

const User = mongoose.model("User", userSchema);
export default User;
```

---

### `utils/generateToken.js` — JWT Helpers

```javascript
import jwt from "jsonwebtoken";

export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
};

export const setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};
```

---

### `controllers/authController.js` — Auth Logic

```javascript
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
} from "../utils/generateToken.js";

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("All fields are required");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists with this email");
  }

  const user = await User.create({ name, email, password });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to DB
  user.refreshToken = refreshToken;
  await user.save();

  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    success: true,
    user,
    accessToken,
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user || !user.password) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  setRefreshTokenCookie(res, refreshToken);

  res.json({
    success: true,
    user,
    accessToken,
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Logged out successfully" });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public (uses refresh token cookie)
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    res.status(401);
    throw new Error("No refresh token");
  }

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== token) {
    res.status(401);
    throw new Error("Invalid refresh token");
  }

  const newAccessToken = generateAccessToken(user._id);
  res.json({ success: true, accessToken: newAccessToken });
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});
```

---

### `middleware/authMiddleware.js` — JWT Verification

```javascript
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id).select("-password -refreshToken");

  if (!req.user) {
    res.status(401);
    throw new Error("User not found");
  }

  next();
});
```

---

### `middleware/errorMiddleware.js` — Global Error Handler

```javascript
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
```

---

### `routes/authRoutes.js`

```javascript
import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.post("/refresh-token", refreshToken);
router.get("/me", protect, getMe);

// Google OAuth routes (Passport.js) — add after setting up passport config
// router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
// router.get("/google/callback", passport.authenticate("google"), googleCallback);

export default router;
```

---

## Google OAuth Setup (Passport.js)

Create `config/passport.js`:

```javascript
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            profilePhoto: profile.photos[0]?.value || "",
          });
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

export default passport;
```

Add to `authController.js`:

```javascript
export const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  const accessToken = generateAccessToken(user._id);
  const refreshTokenVal = generateRefreshToken(user._id);

  user.refreshToken = refreshTokenVal;
  await user.save();

  setRefreshTokenCookie(res, refreshTokenVal);

  // Redirect to frontend with token
  res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${accessToken}`);
});
```

---

## API Endpoints in This Phase

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, get tokens |
| POST | `/api/auth/logout` | Private | Clear tokens |
| POST | `/api/auth/refresh-token` | Public | Get new access token |
| GET | `/api/auth/me` | Private | Get current user |
| GET | `/api/auth/google` | Public | Start Google OAuth |
| GET | `/api/auth/google/callback` | Public | Google OAuth callback |

---

## Testing Checklist (Postman)

- [ ] `POST /api/auth/register` — creates user, returns token
- [ ] `POST /api/auth/register` with duplicate email — returns 400
- [ ] `POST /api/auth/login` — returns access token + sets cookie
- [ ] `POST /api/auth/login` with wrong password — returns 401
- [ ] `GET /api/auth/me` with valid Bearer token — returns user object
- [ ] `GET /api/auth/me` without token — returns 401
- [ ] `POST /api/auth/logout` — clears cookie, nulls refreshToken in DB
- [ ] `POST /api/auth/refresh-token` with valid cookie — returns new access token
- [ ] `GET /api/health` — returns server alive message

---

## ✅ Phase 1 Complete When

- Express server starts without errors
- MongoDB connects successfully
- User can register and receive JWT
- User can login and receive JWT
- Protected routes reject requests without valid token
- Refresh token flow works end-to-end
- All test cases above pass in Postman