import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import nodemailer from "nodemailer";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import dotenv from 'dotenv'

dotenv.config({})

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@eventhub.com";

const createAccessToken = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        // If somehow the user is not found here, propagate an error
        throw new Error("User not found while creating access token");
    }

    const accessToken = user.generateAccessToken();

    return accessToken;
};

// Password strength checker: at least 8 chars, uppercase, lowercase, digit, special char
const isStrongPassword = (password) => {
    if (!password || typeof password !== 'string') return false;
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
    return strongRegex.test(password);
};
// User Registration Controller
export const userRegisteration = async (req, res) => {
    try {
        const { userName, email, password, phoneNumber, role } = req.body;

        if (!userName || !email || !password || !phoneNumber || !role) {
            return res.status(400).json({
                message: "All fields are required",
                success: false
            });
        }

        if (!["organizer", "user", "admin"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role selected",
                success: false
            });
        }

        if (role === "admin" && email !== ADMIN_EMAIL) {
            return res.status(403).json({
                message: "Admin registration is restricted to the configured admin email",
                success: false
            });
        }

        const existingUser = await User.findOne({ email })

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
                success: false
            });
        }

        // Enforce strong password policy
        if (!isStrongPassword(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
                success: false
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let profileImageUrl = null;

        // If image uploaded, send to Cloudinary
        if (req.file?.path) {
            const uploadResult = await uploadToCloudinary(req.file.path, {
                folder: "eventhub/profile",
            });

            try {
                await fs.unlink(req.file.path);
            } catch (e) {
                // ignore cleanup errors
            }

            if (uploadResult?.secure_url) {
                profileImageUrl = uploadResult.secure_url;
            }
        }

        const user = await User.create({
            name: userName,
            email,
            password: hashedPassword,
            phone: phoneNumber,
            role: role,
            profileImage: profileImageUrl
        });

        const createUser = await User.findById(user._id).select("-password");

        return res.status(201).json({
            message: "User registered successfully",
            createUser,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
}

// Login Controller

export const userLogin = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                message: "All fields are required",
                success: false
            });
        }

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        if (role === "admin") {
            if (email !== ADMIN_EMAIL) {
                return res.status(403).json({
                    message: "Unauthorized admin email",
                    success: false
                });
            }
            if (user.role !== "admin") {
                return res.status(403).json({
                    message: "This account is not an admin. Please select the correct role.",
                    success: false
                });
            }
        } else {
            if (user.role !== role) {
                return res.status(403).json({
                    message: `Invalid role. You registered as ${user.role === "organizer" ? "Organizer" : user.role === "admin" ? "Admin" : "User"}. Please select the correct role.`,
                    success: false
                });
            }
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Invalid Password",
                success: false
            });
        }

        const accessToken = await createAccessToken(user._id);

        const options = {
            httpOnly: true,
            secure: false
        }

        const loggedInUser = await User.findById(user._id).select("-password");

        res
            .status(201)
            .cookie("accessToken", accessToken, options)
            .json({
                message: "User logged in successfully",
                loggedInUser,
                success: true
            });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
}

export const userLogout = async (req, res) => {
    try {

        const options = {
            httpOnly: true,
            secure: false
        }

        return res.status(200).clearCookie("accessToken",options).json({
            message: "User Loggedout Successfully",
            success: true
        })
    } catch (error) {
        console.log(error);

    }
}

// Update Profile Controller
export const updateProfile = async (req, res) => {
    try {
        const { userId, name, email, phone } = req.body;

        if (!userId) {
            return res.status(400).json({
                message: "User ID is required",
                success: false
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    message: "Email already in use",
                    success: false
                });
            }
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;

        await user.save();

        const updatedUser = await User.findById(userId).select("-password");

        return res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
}

// Change Password Controller
export const changePassword = async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({
                message: "All fields are required",
                success: false
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Current password is incorrect",
                success: false
            });
        }

        // Enforce strong password for updates
        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({
                message: "New password must be at least 8 characters and include uppercase, lowercase, number, and special character",
                success: false
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({
            message: "Password changed successfully",
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
}

// Upload / Update Profile Image Controller
export const uploadProfileImage = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                message: "User ID is required",
                success: false
            });
        }

        if (!req.file?.path) {
            return res.status(400).json({
                message: "Profile image file is required",
                success: false
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        const uploadResult = await uploadToCloudinary(req.file.path, { folder: "eventhub/profile" });

        // always cleanup temp file
        try {
            await fs.unlink(req.file.path);
        } catch (e) {
            // ignore cleanup errors
        }

        if (!uploadResult?.secure_url) {
            return res.status(500).json({
                message: "Failed to upload image",
                success: false
            });
        }

        user.profileImage = uploadResult.secure_url;
        await user.save();

        const updatedUser = await User.findById(userId).select("-password");

        return res.status(200).json({
            message: "Profile image updated successfully",
            user: updatedUser,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
}

// Forgot Password Controller - Send OTP
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({
                message: "Email is required",
                success: false
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

        // Store OTP in user document
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpiry = otpExpiry;
        await user.save();

        // Send OTP via email
        try {
            // Check if email credentials are configured
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
                console.error("Email credentials not configured in environment variables");
                
                // Development mode: Log OTP to console instead of sending email
                console.log(`\n========== PASSWORD RESET OTP ==========`);
                console.log(`Email: ${email}`);
                console.log(`OTP: ${otp}`);
                console.log(`Valid for: 10 minutes`);
                console.log(`==========================================\n`);
                
                return res.status(200).json({
                    message: "OTP generated successfully. Check server console for OTP (development mode).",
                    success: true,
                    // Remove this in production
                    devMode: true,
                    devOtp: otp
                });
            }

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Password Reset OTP - EventHub',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; color: white; text-align: center;">
                            <h2>Password Reset Request</h2>
                        </div>
                        <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
                            <p style="color: #333; margin-bottom: 20px;">Hello,</p>
                            <p style="color: #666; margin-bottom: 20px;">We received a request to reset your password. Use the OTP below to proceed:</p>
                            <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                                <p style="font-size: 14px; color: #999; margin: 0 0 10px 0; text-transform: uppercase;">Your OTP</p>
                                <h1 style="font-size: 36px; letter-spacing: 5px; color: #667eea; margin: 0; font-weight: bold;">${otp}</h1>
                                <p style="font-size: 12px; color: #999; margin: 10px 0 0 0;">Valid for 10 minutes</p>
                            </div>
                            <p style="color: #666; margin-bottom: 10px;">If you didn't request this, please ignore this email or contact support immediately.</p>
                            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                            <p style="color: #999; font-size: 12px; margin: 0;">© 2024 EventHub. All rights reserved.</p>
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);

            return res.status(200).json({
                message: "OTP sent to your email successfully",
                success: true
            });
        } catch (emailError) {
            console.error("Email sending error:", emailError);
            console.error("Make sure EMAIL_USER and EMAIL_PASSWORD are configured in .env file");
            
            return res.status(500).json({
                message: "Failed to send email. Email credentials may not be configured. Check server console for details.",
                success: false,
                error: emailError.message
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
}

// Verify OTP Controller
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required",
                success: false
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Check if OTP exists and is not expired
        if (!user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
            return res.status(400).json({
                message: "OTP not requested. Please request a new one.",
                success: false
            });
        }

        if (new Date() > user.resetPasswordOtpExpiry) {
            return res.status(400).json({
                message: "OTP has expired. Please request a new one.",
                success: false
            });
        }

        if (user.resetPasswordOtp !== otp) {
            return res.status(400).json({
                message: "Invalid OTP",
                success: false
            });
        }

        return res.status(200).json({
            message: "OTP verified successfully",
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
}

// Reset Password Controller
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                message: "Email, OTP, and new password are required",
                success: false
            });
        }

        // Enforce strong password for reset
        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
                success: false
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Check if OTP exists and is not expired
        if (!user.resetPasswordOtp || !user.resetPasswordOtpExpiry) {
            return res.status(400).json({
                message: "OTP not requested. Please request a new one.",
                success: false
            });
        }

        if (new Date() > user.resetPasswordOtpExpiry) {
            return res.status(400).json({
                message: "OTP has expired. Please request a new one.",
                success: false
            });
        }

        if (user.resetPasswordOtp !== otp) {
            return res.status(400).json({
                message: "Invalid OTP",
                success: false
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear OTP fields
        user.password = hashedPassword;
        user.resetPasswordOtp = null;
        user.resetPasswordOtpExpiry = null;
        await user.save();

        return res.status(200).json({
            message: "Password reset successfully",
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error",
            success: false
        });
    }
}
