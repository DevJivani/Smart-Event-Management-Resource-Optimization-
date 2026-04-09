import {Router} from "express";
import passport from "passport";
import { userLogin, userLogout, userRegisteration, updateProfile, changePassword, uploadProfileImage, forgotPassword, verifyOtp, resetPassword, deleteAccount, updateSettings, verify2FA, getPublicProfile, getAllUsers, getAllOrganizers, toggleUserStatus, contactUs, googleAuthCallback } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// Google SSO routes
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback", 
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  googleAuthCallback
);

router.route("/me").get(verifyJwt, (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user
    });
});

router.route("/register").post(upload.single("profileImage"), userRegisteration);
router.route("/login").post(userLogin)
router.route("/logout").get(userLogout)
router.route("/profile/update").put(updateProfile)
router.route("/profile/image").post(upload.single("profileImage"), uploadProfileImage)
router.route("/password/update").put(changePassword)
router.route("/forgot-password").post(forgotPassword)
router.route("/verify-otp").post(verifyOtp)
router.route("/reset-password").post(resetPassword)
router.route("/account").delete(verifyJwt, deleteAccount)
router.route("/settings").put(verifyJwt, updateSettings)
router.route("/verify-2fa").post(verify2FA)
router.route("/public/:userId").get(getPublicProfile)
router.route("/contact").post(contactUs);

// Admin: User & Organizer management
router.route("/admin/users").get(verifyJwt, isAdmin, getAllUsers);
router.route("/admin/organizers").get(verifyJwt, isAdmin, getAllOrganizers);
router.route("/admin/user/:userId/toggle-status").put(verifyJwt, isAdmin, toggleUserStatus);

export default router;
