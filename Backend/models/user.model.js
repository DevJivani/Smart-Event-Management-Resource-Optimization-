import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Password not required if it's an SSO user
      },
    },
    googleId: {
      type: String,
      default: null,
    },
    isSSO: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["organizer", "user", "admin"],
      default: "user",
    },
    phone: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    resetPasswordOtp: {
      type: String,
      default: null,
    },
    resetPasswordOtpExpiry: {
      type: Date,
      default: null,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    publicProfile: {
      type: Boolean,
      default: false,
    },
    twoFactorAuth: {
      type: Boolean,
      default: false,
    },
    twoFactorOtp: {
      type: String,
      default: null,
    },
    twoFactorOtpExpiry: {
      type: Date,
      default: null,
    },
    upiId: {
      type: String,
      default: null,
    },
    interests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EventCategory",
      },
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    stamps: [
      {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "EventCategory" },
        at: { type: Date, default: Date.now }
      }
    ],
    badges: [
      {
        name: { type: String, required: true },
        icon: { type: String }, // optional icon class or name
        description: { type: String },
        earnedAt: { type: Date, default: Date.now },
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "EventCategory" }
      }
    ]
  },
  { timestamps: true }
);

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model("User", userSchema);
