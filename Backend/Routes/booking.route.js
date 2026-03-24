import express from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createPaidBooking, getMyBookings, downloadInvoice, adminGetAllBookings, getOrganizerBookings, adminGetBookingById, verifyTicket } from "../controllers/booking.controller.js";

const router = express.Router();

router.post("/create", verifyJwt, createPaidBooking);
router.get("/my", verifyJwt, getMyBookings);
router.get("/:bookingId/invoice", verifyJwt, downloadInvoice);
router.get("/admin/all", verifyJwt, adminGetAllBookings);
router.get("/organizer/:organizerId", verifyJwt, getOrganizerBookings);
router.get("/admin/:bookingId", verifyJwt, adminGetBookingById);
router.post("/verify-ticket", verifyJwt, verifyTicket);

export default router;
