import express from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createPaidBooking, getMyBookings, downloadInvoice } from "../controllers/booking.controller.js";

const router = express.Router();

router.post("/create", verifyJwt, createPaidBooking);
router.get("/my", verifyJwt, getMyBookings);
router.get("/:bookingId/invoice", verifyJwt, downloadInvoice);

export default router;

