import express from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getOrCreateChat,
  sendMessage,
  getMyChats,
  deleteMessage,
} from "../controllers/chat.controller.js";

const router = express.Router();

// Get or create a chat
router.post("/get-or-create", verifyJwt, getOrCreateChat);

// Send a message
router.post("/send", verifyJwt, sendMessage);

// Get all my chats
router.get("/my-chats", verifyJwt, getMyChats);

// Delete a message
router.delete("/delete-message", verifyJwt, deleteMessage);


export default router;
