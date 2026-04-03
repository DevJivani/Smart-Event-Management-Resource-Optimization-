import express from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createVoucher, getOrganizerVouchers, updateVoucher, deleteVoucher, validateVoucher,
  getEligibleVouchers,
  getAdvertisedVouchers,
} from "../controllers/voucher.controller.js";

const router = express.Router();

// Public route for ads
router.get("/advertised", getAdvertisedVouchers);

// Organizer routes
router.post("/create", verifyJwt, createVoucher);
router.get("/get", verifyJwt, getOrganizerVouchers);
router.put("/update/:voucherId", verifyJwt, updateVoucher);
router.delete("/delete/:voucherId", verifyJwt, deleteVoucher);

// User route (for booking)
router.post("/validate", verifyJwt, validateVoucher);
router.get("/eligible", verifyJwt, getEligibleVouchers);

export default router;
