import express from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { clearChat, deleteMessage, getOrganizerMessages, getUserMessages, replyToMessage, userFollowUp } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/organizer", verifyJwt, getOrganizerMessages);
router.get("/user", verifyJwt, getUserMessages);
router.post("/reply", verifyJwt, replyToMessage);
router.post("/follow-up", verifyJwt, userFollowUp);
router.post("/clear-chat", verifyJwt, clearChat);
router.delete("/delete", verifyJwt, deleteMessage);

export default router;
