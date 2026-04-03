import express from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { getMemoryBoxData, uploadAttendeePhoto, addOfficialPhotos } from "../controllers/memoryBox.controller.js";

const router = express.Router();

router.get("/:eventId", verifyJwt, getMemoryBoxData);
router.post("/:eventId/upload", verifyJwt, upload.single("photo"), uploadAttendeePhoto);
router.post("/:eventId/official", verifyJwt, upload.array("officialPhotos", 10), addOfficialPhotos);

export default router;
