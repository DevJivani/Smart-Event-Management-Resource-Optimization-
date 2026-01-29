import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const createAccessToken = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        // If somehow the user is not found here, propagate an error
        throw new Error("User not found while creating access token");
    }

    const accessToken = user.generateAccessToken();

    return accessToken;
};

// User Registration Controller
export const userRegisteration = async (req, res) => {
    try {
        const { userName, email, password, phoneNumber } = req.body;

        if (!userName || !email || !password || !phoneNumber) {
            return res.status(400).json({
                message: "All fields are required",
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
        const { email, password } = req.body;

        if (!email || !password) {
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