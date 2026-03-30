import express from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createVoucher, getOrganizerVouchers, updateVoucher, deleteVoucher, validateVoucher, notifyUsers, getEligibleVouchers } from "../controllers/voucher.controller.js";

const router = express.Router();

// Organizer routes
router.post("/create", verifyJwt, createVoucher);
router.get("/get", verifyJwt, getOrganizerVouchers);
router.put("/update/:voucherId", verifyJwt, updateVoucher);
router.delete("/delete/:voucherId", verifyJwt, deleteVoucher);
router.post("/notify/:voucherId", verifyJwt, notifyUsers);

// User route (for booking)
router.post("/validate", verifyJwt, validateVoucher);
router.get("/eligible", verifyJwt, getEligibleVouchers);

export default router;
