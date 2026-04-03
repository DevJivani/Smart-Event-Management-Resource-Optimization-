import express from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getMatches,
  sendConnectionRequest,
  updateConnectionStatus,
  getConnectionRequests,
  blockUser,
  unblockUser,
  getBlockedUsers,
} from "../controllers/matchmaker.controller.js";

const router = express.Router();

// Block/Unblock users
router.post("/block", verifyJwt, blockUser);
router.post("/unblock", verifyJwt, unblockUser);
router.get("/blocked-list", verifyJwt, getBlockedUsers);


// Get connection requests
router.get("/requests", verifyJwt, getConnectionRequests);

// Get matches for an event
router.get("/matches/:eventId", verifyJwt, getMatches);

// Send connection request or "Quick Hello"
router.post("/connect", verifyJwt, sendConnectionRequest);

// Update connection status (accept/reject)
router.patch("/status", verifyJwt, updateConnectionStatus);

export default router;
