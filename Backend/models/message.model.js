import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // can be anonymous if not logged in
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    messages: [
      {
        senderType: { type: String, enum: ["user", "organizer"], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Array to track users who deleted for themselves
        isDeletedForEveryone: { type: Boolean, default: false } // Boolean to track if deleted for everyone
      }
    ],
    isReplied: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
