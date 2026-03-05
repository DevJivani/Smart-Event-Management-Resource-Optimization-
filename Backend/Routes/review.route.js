import express from "express";
import { adminGetAllReviews, approveReview, hideReview, replyToReview } from "../controllers/review.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/admin/all", verifyJwt, adminGetAllReviews);
router.patch("/:reviewId/approve", verifyJwt, approveReview);
router.patch("/:reviewId/hide", verifyJwt, hideReview);
router.post("/:reviewId/reply", verifyJwt, replyToReview);

export default router;
