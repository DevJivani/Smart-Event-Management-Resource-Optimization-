import { User } from "../models/user.model.js";
import jwt from 'jsonwebtoken'


export const verifyJwt = async(req,res,next) =>{
    try {
        const token = req.cookies?.accessToken;
    
        if(!token){
            return res.status(401).json({
                message: "Unauthorized request",
                success: false
            })
        }

        const decodeToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodeToken?._id).select("-password")
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized request",
                success: false
            })
        }

        if (user.isBlocked) {
            return res.status(403).json({
                message: "Your account has been blocked by the admin. Please contact support.",
                success: false,
                isBlocked: true
            });
        }

        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized request",
            success: false
        })
    }

}

export const optionalVerifyJwt = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken;
        if (!token) {
            return next();
        }
        const decodeToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodeToken?._id).select("-password");
        if (user) {
            req.user = user;
        }
        next();
    } catch (error) {
        next();
    }
};

export const isAdmin = async (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({
            message: "Forbidden: Admin access required",
            success: false
        });
    }
    next();
};
