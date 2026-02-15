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

        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized request",
            success: false
        })
    }

}
