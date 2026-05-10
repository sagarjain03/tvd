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

// Hash password before saving (Phase 1)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
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

// Geospatial index for location-based matching (Phase 4)
userSchema.index({ location: "2dsphere" });

const User = mongoose.model("User", userSchema);
export default User;
