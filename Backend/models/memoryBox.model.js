import mongoose from "mongoose";

const memoryBoxSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    photos: [
      {
        type: String,
      },
    ],
    message: {
      type: String,
    },
  },
  { timestamps: true }
);

export const MemoryBox = mongoose.model("MemoryBox", memoryBoxSchema);
