import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";


const createAccessToken = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({
            message: "User not found",
            success: false
        })
    }

    const accessToken = user.generateAccessToken();

    return accessToken;

}

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

        const user = await User.create({
            name: userName,
            email,
            password: hashedPassword,
            phone: phoneNumber
        });

        const createUser = await User.findById(user._id).select("-password");

        return res.status(201).json({
            message: "User registered successfully",
            createUser,
            success: true
        });

    } catch (error) {
        console.log(error);
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

        const accessToken = await createAccessToken(user._id)

        const options = {
            httpOnly: true,
            secure: false
        }

        const loggedInUser = await User.findById(user._id).select("-password");

        res.status(201).cookie("accessToken", accessToken, options).json({
            message: "User logged in successfully",
            loggedInUser,
            success: true
        })


    } catch (error) {
        console.log(error);

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