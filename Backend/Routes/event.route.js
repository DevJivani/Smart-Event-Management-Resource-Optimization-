import express from "express";
import { createEvent, deleteEvent, getEventById, getEventCategories, getOrganizerEvents, updateEvent, getAllEvents, adminApproveEvent, adminDisableEvent, adminEnableEvent, adminGetAllEvents, adminUpdateStatus } from "../controllers/event.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Get all categories
router.get("/categories", getEventCategories);

// Get all public events
router.get("/", getAllEvents);

// Admin: Get all events
router.get("/admin/all", verifyJwt, adminGetAllEvents);

// Get event by ID
router.get("/:eventId", getEventById);

// Get all events by organizer
router.get("/organizer/:organizerId", getOrganizerEvents);

// Create event (with image upload)
router.post("/create", verifyJwt, upload.single("bannerImage"), createEvent);

// Update event (with image upload)
router.put("/:eventId/organizer/:organizerId", verifyJwt, upload.single("bannerImage"), updateEvent);

// Delete event
router.delete("/:eventId/organizer/:organizerId", verifyJwt, deleteEvent);

// Admin actions
router.put("/:eventId/admin/approve", verifyJwt, adminApproveEvent);
router.put("/:eventId/admin/disable", verifyJwt, adminDisableEvent);
router.put("/:eventId/admin/enable", verifyJwt, adminEnableEvent);
router.put("/:eventId/admin/status", verifyJwt, adminUpdateStatus);

export default router;
