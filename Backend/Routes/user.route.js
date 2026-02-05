import {Router} from "express";
import { userLogin, userLogout, userRegisteration, updateProfile, changePassword, uploadProfileImage, forgotPassword, verifyOtp, resetPassword } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(upload.single("profileImage"), userRegisteration);
router.route("/login").post(userLogin)
router.route("/logout").get(userLogout)
router.route("/profile/update").put(updateProfile)
router.route("/profile/image").post(upload.single("profileImage"), uploadProfileImage)
router.route("/password/update").put(changePassword)
router.route("/forgot-password").post(forgotPassword)
router.route("/verify-otp").post(verifyOtp)
router.route("/reset-password").post(resetPassword)

export default router;
