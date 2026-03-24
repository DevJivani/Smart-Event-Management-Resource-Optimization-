import express from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getOrganizerMessages, replyToMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/organizer", verifyJwt, getOrganizerMessages);
router.post("/reply", verifyJwt, replyToMessage);

export default router;
