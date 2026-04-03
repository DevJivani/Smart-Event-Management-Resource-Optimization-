import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
      default: null,
    },
    bookingStatus: {
      type: String,
      enum: ["pending", "awaiting-verification", "confirmed", "cancelled"],
      default: "confirmed",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    transactionId: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending"],
      default: "pending",
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    ticketSecret: {
      type: String,
      unique: true,
    },
    checkInStatus: {
      type: String,
      enum: ["pending", "checked-in"],
      default: "pending",
    },
    checkInTime: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);
