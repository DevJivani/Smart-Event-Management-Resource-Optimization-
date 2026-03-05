import express from "express";
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from "../controllers/notification.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/my", verifyJwt, getMyNotifications);
router.patch("/:id/read", verifyJwt, markNotificationRead);
router.patch("/read-all", verifyJwt, markAllNotificationsRead);

export default router;
