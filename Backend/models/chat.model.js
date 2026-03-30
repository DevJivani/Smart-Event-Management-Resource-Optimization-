import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [
      {
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        isRead: {
          type: Boolean,
          default: false,
        },
        deletedBy: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        isDeletedForEveryone: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

export const Chat = mongoose.model("Chat", chatSchema);
