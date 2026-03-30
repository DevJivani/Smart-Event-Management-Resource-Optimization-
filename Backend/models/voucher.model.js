import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    minAmount: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: null, // null means no limit
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null, // null means applicable to all events
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    requiredBadge: {
      type: String,
      default: null, // If set, only users with this badge name can use it
    },
  },
  { timestamps: true }
);

export const Voucher = mongoose.model("Voucher", voucherSchema);
