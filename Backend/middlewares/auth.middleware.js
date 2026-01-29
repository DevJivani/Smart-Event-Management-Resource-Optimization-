import { User } from "../models/user.model";


export const verifyJwt = async(req,res,next) =>{
    try {
        const token = req.cookies?.accessToken;
    
        if(!token){
            return res.status(401).json({
                message: "Unauthorized request",
                success: false
            })
        }

        const decodeToken = await Jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodeToken?._id).select("-password")

        req.user = user;
        next();

    } catch (error) {
        console.log(error);
        
    }

}